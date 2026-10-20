import test from "node:test";
import assert from "node:assert/strict";
import { createRateLimitMiddleware } from "../src/middleware/rateLimitMiddleware.js";

const callMiddleware = (middleware, req) => {
  const headers = {};
  return new Promise((resolve) => {
    middleware(req, { setHeader: (name, value) => { headers[name] = value; } }, (error) => {
      resolve({ error: error || null, headers });
    });
  });
};

test("per-user limits isolate accounts and return bounded rate headers", async () => {
  const bucketStore = new Map();
  const middleware = createRateLimitMiddleware(
    { namespace: "profile", byUser: true, max: 1, windowMs: 10_000 },
    { bucketStore, clock: () => 1_000 }
  );
  const req = (id) => ({ ip: "192.0.2.4", user: { id }, headers: { "x-forwarded-for": "198.51.100.100" } });

  const first = await callMiddleware(middleware, req("user-a"));
  const repeated = await callMiddleware(middleware, req("user-a"));
  const separate = await callMiddleware(middleware, req("user-b"));

  assert.equal(first.error, null);
  assert.equal(first.headers["X-RateLimit-Limit"], "1");
  assert.equal(first.headers["X-RateLimit-Remaining"], "0");
  assert.equal(repeated.error.statusCode, 429);
  assert.equal(separate.error, null);
  assert.deepEqual([...bucketStore.keys()].sort(), ["profile:user:user-a", "profile:user:user-b"]);
});

test("IP limits use Express req.ip rather than client forwarded headers", async () => {
  const bucketStore = new Map();
  const middleware = createRateLimitMiddleware(
    { namespace: "global", max: 1, windowMs: 10_000 },
    { bucketStore, clock: () => 1_000 }
  );
  const first = await callMiddleware(middleware, {
    ip: "203.0.113.7", headers: { "x-forwarded-for": "192.0.2.99" }
  });
  const sameIp = await callMiddleware(middleware, {
    ip: "203.0.113.7", headers: { "x-forwarded-for": "198.51.100.5" }
  });
  const otherIp = await callMiddleware(middleware, {
    ip: "203.0.113.8", headers: { "x-forwarded-for": "192.0.2.99" }
  });

  assert.equal(first.error, null);
  assert.equal(sameIp.error.statusCode, 429);
  assert.equal(otherIp.error, null);
  assert.ok(bucketStore.has("global:203.0.113.7"));
  assert.ok(bucketStore.has("global:203.0.113.8"));
  assert.ok(!bucketStore.has("global:192.0.2.99"));
});

test("expired buckets start a new fixed window", async () => {
  const bucketStore = new Map();
  let now = 1_000;
  const middleware = createRateLimitMiddleware(
    { namespace: "auth", max: 1, windowMs: 5_000 },
    { bucketStore, clock: () => now }
  );
  const req = { ip: "203.0.113.9", headers: {} };

  assert.equal((await callMiddleware(middleware, req)).error, null);
  assert.equal((await callMiddleware(middleware, req)).error.statusCode, 429);
  now = 6_000;
  assert.equal((await callMiddleware(middleware, req)).error, null);
  assert.equal(bucketStore.get("auth:203.0.113.9").count, 1);
});

test("multiple middleware instances share an injected durable limiter and fail closed when it is unavailable", async () => {
  const buckets = new Map();
  const durableStore = {
    async consume(key, { windowMs, now }) {
      const current = buckets.get(key);
      const bucket = !current || current.resetAt <= now
        ? { count: 0, resetAt: now + windowMs }
        : current;
      bucket.count += 1;
      buckets.set(key, bucket);
      return bucket;
    }
  };
  const options = { namespace: "shared", max: 1, windowMs: 10_000 };
  const firstWorker = createRateLimitMiddleware(options, { durableStore, clock: () => 1_000 });
  const secondWorker = createRateLimitMiddleware(options, { durableStore, clock: () => 1_000 });
  const request = { ip: "203.0.113.11", headers: {} };

  assert.equal((await callMiddleware(firstWorker, request)).error, null);
  assert.equal((await callMiddleware(secondWorker, request)).error.statusCode, 429);

  const unavailable = createRateLimitMiddleware(options, {
    durableStore: { consume: async () => { throw new Error("database unavailable"); } }
  });
  assert.equal((await callMiddleware(unavailable, request)).error.statusCode, 503);
});
