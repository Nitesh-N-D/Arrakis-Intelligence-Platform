import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import app from "../src/app.js";
import { env } from "../src/config/env.js";

test("Express rejects untrusted CORS origins as a sanitized 403 and serves trusted origins", async (context) => {
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  context.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const rejected = await fetch(`${baseUrl}/health`, {
    headers: { Origin: "https://untrusted.example" }
  });

  assert.equal(rejected.status, 403);
  assert.equal(rejected.headers.get("access-control-allow-origin"), null);
  assert.deepEqual(await rejected.json(), {
    success: false,
    message: "Origin is not allowed by CORS.",
    details: null
  });

  const allowedOrigin = env.allowedOrigins[0] || "http://localhost:5173";
  const allowed = await fetch(`${baseUrl}/health`, {
    headers: { Origin: allowedOrigin }
  });
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers.get("access-control-allow-origin"), allowedOrigin);
  assert.equal((await allowed.json()).success, true);
});
