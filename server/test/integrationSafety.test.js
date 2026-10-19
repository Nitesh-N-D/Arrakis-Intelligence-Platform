import test from "node:test";
import assert from "node:assert/strict";
import { getIsolatedTestDatabaseUri } from "../integration/mongoReplicaSet.js";

test("integration tests accept only the explicitly named isolated database", () => {
  const uri = "mongodb://127.0.0.1:27017/arrakis_integration_test?replicaSet=rs0";
  assert.equal(getIsolatedTestDatabaseUri(uri), uri);
});

test("integration tests reject missing, production, and non-Mongo database URIs", () => {
  assert.throws(() => getIsolatedTestDatabaseUri(""), /Set MONGODB_TEST_URI/);
  assert.throws(
    () => getIsolatedTestDatabaseUri("mongodb://127.0.0.1/arrakis"),
    /database is arrakis_integration_test/
  );
  assert.throws(
    () => getIsolatedTestDatabaseUri("mongodb://cluster.example.com/arrakis_integration_test"),
    /loopback MongoDB host/
  );
  assert.throws(
    () => getIsolatedTestDatabaseUri("https://example.com/arrakis_integration_test"),
    /database is arrakis_integration_test/
  );
});
