import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertDestructiveSeedAllowed } from "../src/seed/seedSafety.js";

const localTarget = "mongodb://127.0.0.1:27017/arrakis-intelligence";

test("destructive demo seeding requires an explicit opt-in", () => {
  assert.throws(
    () => assertDestructiveSeedAllowed({ nodeEnv: "development", mongoUri: localTarget }),
    /ARRAKIS_ALLOW_DESTRUCTIVE_SEED=true/
  );
});

test("demo seeding refuses production even with explicit opt-in", () => {
  for (const nodeEnv of ["production", "Production"]) {
    assert.throws(
      () => assertDestructiveSeedAllowed({ nodeEnv, mongoUri: "mongodb://127.0.0.1/production", allowDestructiveSeed: "true" }),
      /disabled in production/
    );
  }
});

test("demo seeding refuses remote and malformed MongoDB targets", () => {
  assert.throws(
    () => assertDestructiveSeedAllowed({ nodeEnv: "development", mongoUri: "mongodb+srv://cluster.example/arrakis", allowDestructiveSeed: "true" }),
    /loopback MongoDB host/
  );
  assert.throws(
    () => assertDestructiveSeedAllowed({ nodeEnv: "development", mongoUri: "not-a-uri", allowDestructiveSeed: "true" }),
    /valid MongoDB URI/
  );
});

test("demo seeding accepts only an explicitly confirmed loopback development database", () => {
  assert.equal(
    assertDestructiveSeedAllowed({ nodeEnv: "development", mongoUri: localTarget, allowDestructiveSeed: "true" }),
    undefined
  );
});

test("seed CLI refuses production before attempting a database connection", () => {
  const seedPath = fileURLToPath(new URL("../src/seed/seed.js", import.meta.url));
  const result = spawnSync(process.execPath, [seedPath], {
    encoding: "utf8",
    timeout: 5000,
    env: {
      ...process.env,
      NODE_ENV: "production",
      MONGODB_URI: "mongodb://127.0.0.1:1/production",
      ARRAKIS_ALLOW_DESTRUCTIVE_SEED: "true"
    }
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /demo seed is disabled in production/);
  assert.doesNotMatch(result.stderr, /ECONNREFUSED|MongoServerSelectionError/);
});
