import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { RefreshToken } from "../src/models/RefreshToken.js";
import { User } from "../src/models/User.js";
import { RefreshTokenRepository } from "../src/repositories/RefreshTokenRepository.js";
import { connectTestReplicaSet, disconnectTestReplicaSet } from "./mongoReplicaSet.js";

let connected = false;
let userId;
let refreshTokenId;

before(async () => {
  await connectTestReplicaSet();
  connected = true;
  await Promise.all([RefreshToken.init(), User.init()]);
});

after(async () => {
  if (!connected) return;
  if (refreshTokenId) await RefreshToken.deleteOne({ _id: refreshTokenId });
  if (userId) await User.deleteOne({ _id: userId });
  await disconnectTestReplicaSet();
});

test("MongoDB atomic refresh-token consumption succeeds once under concurrency", async () => {
  const user = await User.create({ name: "Token Operative", email: `token-${randomUUID()}@example.test` });
  userId = user._id;
  const tokenHash = `integration-${randomUUID()}`;
  const token = await RefreshToken.create({
    user: user._id,
    tokenHash,
    expiresAt: new Date(Date.now() + 60 * 60_000)
  });
  refreshTokenId = token._id;
  const repository = new RefreshTokenRepository();

  const results = await Promise.all([
    repository.consumeValidToken(tokenHash),
    repository.consumeValidToken(tokenHash)
  ]);
  assert.equal(results.filter(Boolean).length, 1);
  const storedToken = await RefreshToken.findById(token._id);
  assert.ok(storedToken.revokedAt instanceof Date);
});
