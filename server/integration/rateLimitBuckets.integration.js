import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { RateLimitBucket } from "../src/models/RateLimitBucket.js";
import { createRateLimitMiddleware } from "../src/middleware/rateLimitMiddleware.js";
import { RateLimitBucketRepository } from "../src/repositories/RateLimitBucketRepository.js";
import { createMentatBudgetCheck } from "../src/services/mentatService.js";
import { connectTestReplicaSet, disconnectTestReplicaSet } from "./mongoReplicaSet.js";

let connected = false;

const callMiddleware = (middleware, req) => new Promise((resolve) => {
  const headers = {};
  middleware(req, { setHeader: (name, value) => { headers[name] = value; } }, (error) => {
    resolve({ error: error || null, headers });
  });
});

before(async () => {
  await connectTestReplicaSet();
  connected = true;
  await RateLimitBucket.init();
});

after(async () => {
  if (!connected) return;
  await RateLimitBucket.deleteMany({});
  await disconnectTestReplicaSet();
});

test("separate API and Mentat limiter instances share Mongo counters with hashed identities", async () => {
  const repositoryA = new RateLimitBucketRepository();
  const repositoryB = new RateLimitBucketRepository();
  const now = Date.now();
  const firstApiWorker = createRateLimitMiddleware(
    { namespace: "integration-shared", max: 1, windowMs: 60_000 },
    { durableStore: repositoryA, clock: () => now }
  );
  const secondApiWorker = createRateLimitMiddleware(
    { namespace: "integration-shared", max: 1, windowMs: 60_000 },
    { durableStore: repositoryB, clock: () => now }
  );
  const req = { ip: "203.0.113.200", headers: {} };

  assert.equal((await callMiddleware(firstApiWorker, req)).error, null);
  assert.equal((await callMiddleware(secondApiWorker, req)).error.statusCode, 429);
  const ipKeyHash = createHash("sha256").update("integration-shared:203.0.113.200").digest("hex");
  const storedIpBucket = await RateLimitBucket.findById(ipKeyHash).lean();
  assert.equal(storedIpBucket.count, 2);
  assert.equal(storedIpBucket._id.includes("203.0.113.200"), false);

  const configuration = { mentatMaxRequestsPerUserDay: 1, mentatMaxRequestsGlobalDay: 5 };
  const checkA = createMentatBudgetCheck({ repository: repositoryA, clock: () => now });
  const checkB = createMentatBudgetCheck({ repository: repositoryB, clock: () => now });
  await checkA("integration-user", configuration);
  await assert.rejects(checkB("integration-user", configuration), { statusCode: 429 });
  await checkB("second-user", configuration);

  const today = new Date(now).toISOString().slice(0, 10);
  const globalHash = createHash("sha256").update(`mentat:global:${today}`).digest("hex");
  const globalBucket = await RateLimitBucket.findById(globalHash).lean();
  assert.equal(globalBucket.count, 2);
});
