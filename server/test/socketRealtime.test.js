import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import jwt from "jsonwebtoken";
import { io as createSocketClient } from "socket.io-client";
import { env } from "../src/config/env.js";
import { signAccessToken } from "../src/utils/jwt.js";
import { initializeSocket } from "../src/socket/index.js";

const createSocketHarness = async () => {
  const httpServer = http.createServer();
  const socketServer = initializeSocket(httpServer);
  await new Promise((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(0, "127.0.0.1", resolve);
  });
  const address = httpServer.address();
  return {
    socketServer,
    url: `http://127.0.0.1:${address.port}`,
    async close() {
      await new Promise((resolve) => socketServer.close(resolve));
    }
  };
};

const connectSocket = (url, auth) => {
  const client = createSocketClient(url, {
    auth,
    extraHeaders: { Origin: env.clientUrl },
    reconnection: false,
    timeout: 2_000
  });
  return {
    client,
    connected: new Promise((resolve, reject) => {
      client.once("connect", () => resolve(client));
      client.once("connect_error", reject);
    })
  };
};

test("live Socket.IO connections join only the room derived from the signed token", async () => {
  const harness = await createSocketHarness();
  const signedToken = signAccessToken({ sub: "token-operative" });
  const { client, connected } = connectSocket(harness.url, {
    token: signedToken,
    userId: "attacker-operative",
    rooms: ["user:victim-operative"]
  });

  try {
    await connected;
    const serverSocket = harness.socketServer.sockets.sockets.get(client.id);
    assert.ok(serverSocket);
    assert.ok(serverSocket.rooms.has("user:token-operative"));
    assert.ok(!serverSocket.rooms.has("user:attacker-operative"));
    assert.ok(!serverSocket.rooms.has("user:victim-operative"));
  } finally {
    client.close();
    await harness.close();
  }
});

test("live Socket.IO rejects anonymous clients and disconnects after access-token expiry", async () => {
  const harness = await createSocketHarness();
  const anonymous = connectSocket(harness.url, {});
  try {
    await assert.rejects(anonymous.connected, /Unauthorized socket connection/);
    assert.equal(harness.socketServer.sockets.sockets.size, 0);
  } finally {
    anonymous.client.close();
  }

  const expiringToken = jwt.sign({ sub: "expiring-operative" }, env.jwtAccessSecret, { expiresIn: "2s" });
  const expiring = connectSocket(harness.url, { token: expiringToken });
  try {
    await expiring.connected;
    const reason = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Socket remained connected after token expiry")), 5_000);
      expiring.client.once("disconnect", (value) => {
        clearTimeout(timeout);
        resolve(value);
      });
    });
    assert.equal(reason, "io server disconnect");
  } finally {
    expiring.client.close();
    await harness.close();
  }
});
