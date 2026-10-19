import mongoose from "mongoose";

export function getIsolatedTestDatabaseUri(uri = process.env.MONGODB_TEST_URI) {
  if (!uri) {
    throw new Error("Set MONGODB_TEST_URI to an isolated MongoDB replica set to run integration tests.");
  }

  const parsed = new URL(uri);
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!/^mongodb(?:\+srv)?:$/.test(parsed.protocol) || databaseName !== "arrakis_integration_test") {
    throw new Error("Integration tests only accept a MongoDB URI whose database is arrakis_integration_test.");
  }
  if (!["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname.toLowerCase())) {
    throw new Error("Integration tests only connect to a loopback MongoDB host.");
  }
  return uri;
}

export async function connectTestReplicaSet() {
  const uri = getIsolatedTestDatabaseUri();
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
    if (!mongoose.connection.db) throw new Error("MongoDB test database connection was not established.");
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    if (!hello.setName) throw new Error("MongoDB integration tests require a replica set.");
    return mongoose.connection;
  } catch (error) {
    await mongoose.disconnect();
    throw error;
  }
}

export async function disconnectTestReplicaSet() {
  await mongoose.disconnect();
}
