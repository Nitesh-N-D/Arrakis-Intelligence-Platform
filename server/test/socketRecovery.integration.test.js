import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { io as createClient } from "socket.io-client";
import { installSocketRecovery } from "../../client/src/services/socketRecovery.js";

test("Socket.IO server disconnect refreshes the session, reconnects with the new token, and resyncs", { timeout: 5000 }, async () => {
  const httpServer = createServer();
  const ioServer = new Server(httpServer, { cors: { origin: true, credentials: true } });
  const receivedTokens = [];
  let connectionCount = 0;
  let firstServerSocket;
  let clientConnectionCount = 0;
  let resolveFirstClientConnect;
  let resolveSecondClientConnect;
  const firstClientConnect = new Promise((resolve) => { resolveFirstClientConnect = resolve; });
  const secondClientConnect = new Promise((resolve) => { resolveSecondClientConnect = resolve; });

  ioServer.on("connection", (serverSocket) => {
    connectionCount += 1;
    receivedTokens.push(serverSocket.handshake.auth.token);
    if (connectionCount === 1) firstServerSocket = serverSocket;
  });

  await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
  const address = httpServer.address();
  const client = createClient(`http://127.0.0.1:${address.port}`, {
    autoConnect: false,
    reconnection: false,
    transports: ["websocket"],
    auth: { token: "expired-token" }
  });
  client.on("connect", () => {
    clientConnectionCount += 1;
    if (clientConnectionCount === 1) resolveFirstClientConnect();
    if (clientConnectionCount === 2) resolveSecondClientConnect();
  });
  let refreshCount = 0;
  let resyncCount = 0;
  const removeRecovery = installSocketRecovery({
    socket: client,
    refreshSession: async () => {
      refreshCount += 1;
      return { data: { accessToken: "fresh-token" } };
    },
    updateAccessToken: (token) => {
      client.auth = { token };
      if (client.disconnected) client.connect();
    },
    onResync: () => { resyncCount += 1; }
  });

  try {
    client.connect();
    await firstClientConnect;
    firstServerSocket.disconnect(true);
    await secondClientConnect;

    assert.equal(refreshCount, 1);
    assert.equal(connectionCount, 2);
    assert.deepEqual(receivedTokens, ["expired-token", "fresh-token"]);
    assert.equal(resyncCount, 1);
  } finally {
    removeRecovery();
    client.disconnect();
    const closingServer = new Promise((resolve) => ioServer.close(resolve));
    httpServer.closeAllConnections();
    await closingServer;
  }
});
