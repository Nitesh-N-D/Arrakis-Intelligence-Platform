import test from "node:test";
import assert from "node:assert/strict";
import { authorize, createProtect } from "../src/middleware/authMiddleware.js";

const invoke = (middleware, req) => new Promise((resolve) => {
  middleware(req, {}, (error) => resolve(error || null));
});

test("authentication loads the account identified by the signed token, ignoring client-supplied IDs", async () => {
  const lookups = [];
  const user = { id: "user-from-token", role: "user" };
  const protect = createProtect({
    verifyToken(token) {
      assert.equal(token, "signed-token");
      return { sub: "user-from-token" };
    },
    userRepository: {
      async findById(id) { lookups.push(id); return user; }
    }
  });
  const req = {
    headers: { authorization: "Bearer signed-token" },
    body: { userId: "victim-account" },
    params: { userId: "victim-account" }
  };

  assert.equal(await invoke(protect, req), null);
  assert.deepEqual(lookups, ["user-from-token"]);
  assert.equal(req.user, user);
});

test("authentication rejects missing, invalid, and deleted-user credentials", async () => {
  const missing = createProtect({ userRepository: { findById: async () => null } });
  const missingError = await invoke(missing, { headers: {} });
  assert.equal(missingError.statusCode, 401);

  const invalid = createProtect({
    verifyToken() { throw new Error("expired"); },
    userRepository: { findById: async () => null }
  });
  const invalidError = await invoke(invalid, { headers: { authorization: "Bearer invalid" } });
  assert.equal(invalidError.statusCode, 401);

  const deleted = createProtect({
    verifyToken: () => ({ sub: "deleted" }),
    userRepository: { findById: async () => null }
  });
  const deletedError = await invoke(deleted, { headers: { authorization: "Bearer valid" } });
  assert.equal(deletedError.statusCode, 401);
});

test("role authorization denies non-admin users and accepts allowed roles", async () => {
  const deny = await invoke(authorize("admin"), { user: { role: "user" } });
  assert.equal(deny.statusCode, 403);
  assert.equal(await invoke(authorize("user", "admin"), { user: { role: "user" } }), null);
});
