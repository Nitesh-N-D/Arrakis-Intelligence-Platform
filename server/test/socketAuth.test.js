import test from "node:test";
import assert from "node:assert/strict";
import { createSocketAuthMiddleware } from "../src/socket/index.js";

const authenticate = (middleware, socket) => new Promise((resolve) => {
  middleware(socket, (error) => resolve(error || null));
});

test("socket identity is taken from the verified token and token expiry is retained", async () => {
  const socket = {
    handshake: { auth: { token: "signed", userId: "attacker-controlled" } },
    data: { userId: "also-untrusted" }
  };
  const middleware = createSocketAuthMiddleware({
    verifyToken: (token) => {
      assert.equal(token, "signed");
      return { sub: "token-user", exp: 20 };
    },
    clock: () => 10_000
  });

  assert.equal(await authenticate(middleware, socket), null);
  assert.equal(socket.data.userId, "token-user");
  assert.equal(socket.data.tokenExpiresAt, 20_000);
});

test("socket auth rejects missing, expired, malformed, and subjectless tokens", async () => {
  const verifyToken = (token) => {
    if (token === "expired") return { sub: "user", exp: 9 };
    if (token === "no-exp") return { sub: "user" };
    if (token === "no-sub") return { exp: 20 };
    throw new Error("invalid");
  };
  const middleware = createSocketAuthMiddleware({ verifyToken, clock: () => 10_000 });
  for (const token of [undefined, "bad", "expired", "no-exp", "no-sub"]) {
    const error = await authenticate(middleware, {
      handshake: { auth: token ? { token } : {} }, data: {}
    });
    assert.equal(error.message, "Unauthorized socket connection");
  }
});
