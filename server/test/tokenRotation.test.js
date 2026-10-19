import test from "node:test";
import assert from "node:assert/strict";
import { TokenService } from "../src/services/tokenService.js";
import { signRefreshToken } from "../src/utils/jwt.js";
import { hashOpaqueToken } from "../src/utils/tokens.js";

test("one refresh token cannot be consumed twice concurrently", async () => {
  const user = { id: "507f1f77bcf86cd799439011", role: "user" };
  const oldToken = signRefreshToken({ sub: user.id });
  const records = new Map([[hashOpaqueToken(oldToken), { user, expiresAt: new Date(Date.now() + 60_000) }]]);
  let consumeCalls = 0;
  let issued = 0;
  const repository = {
    async consumeValidToken(tokenHash) {
      consumeCalls += 1;
      const record = records.get(tokenHash);
      if (!record || record.expiresAt <= new Date()) return null;
      records.delete(tokenHash);
      return record;
    },
    async create(record) { issued += 1; records.set(record.tokenHash, { user }); },
    async revokeToken(tokenHash) { records.delete(tokenHash); }
  };
  const service = new TokenService({ refreshTokenRepository: repository });

  const results = await Promise.allSettled([
    service.rotateRefreshToken(oldToken),
    service.rotateRefreshToken(oldToken)
  ]);

  assert.equal(consumeCalls, 2);
  assert.equal(issued, 1);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.filter((result) => result.status === "rejected" && result.reason.statusCode === 401).length, 1);
});
