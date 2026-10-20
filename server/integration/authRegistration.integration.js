import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { User } from "../src/models/User.js";
import { AuthService } from "../src/services/authService.js";
import { connectTestReplicaSet, disconnectTestReplicaSet } from "./mongoReplicaSet.js";

let connected = false;
const fixtureEmails = [];

before(async () => {
  await connectTestReplicaSet();
  connected = true;
  await User.init();
});

after(async () => {
  if (!connected) return;
  await User.deleteMany({ email: { $in: fixtureEmails } });
  await disconnectTestReplicaSet();
});

test("concurrent registrations for one email create one account and return one 409", async () => {
  const email = `registration-race-${randomUUID()}@example.test`;
  fixtureEmails.push(email);

  let reads = 0;
  let releaseReads;
  const bothReadsComplete = new Promise((resolve) => { releaseReads = resolve; });
  const userRepository = {
    async findByEmail(value) {
      let user;
      let queryError;
      try {
        user = await User.findOne({ email: value });
      } catch (error) {
        queryError = error;
      }
      reads += 1;
      if (reads === 2) releaseReads();
      await bothReadsComplete;
      if (queryError) throw queryError;
      return user;
    },
    create(data) { return User.create(data); }
  };
  let tokensIssued = 0;
  const tokenService = { async issueTokens() { tokensIssued += 1; return { accessToken: "fixture", refreshToken: "fixture" }; } };
  const first = new AuthService({ userRepository, tokenService });
  const second = new AuthService({ userRepository, tokenService });
  const payload = { name: "Race Fixture", email, password: "valid password", targetRole: "AI Systems Engineer" };

  const outcomes = await Promise.allSettled([first.register(payload), second.register(payload)]);
  const successes = outcomes.filter(({ status }) => status === "fulfilled");
  const failures = outcomes.filter(({ status }) => status === "rejected");

  assert.equal(successes.length, 1);
  assert.equal(failures.length, 1);
  assert.equal(failures[0].reason.statusCode, 409);
  assert.equal(failures[0].reason.message, "A user with this email already exists");
  assert.equal(tokensIssued, 1);
  assert.equal(await User.countDocuments({ email }), 1);
});
