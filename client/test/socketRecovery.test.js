import test from "node:test";
import assert from "node:assert/strict";
import { installSocketRecovery } from "../src/services/socketRecovery.js";

class FakeSocket {
  listeners = new Map();
  disconnectCount = 0;

  on(event, listener) {
    const listeners = this.listeners.get(event) || new Set();
    listeners.add(listener);
    this.listeners.set(event, listeners);
  }

  off(event, listener) {
    this.listeners.get(event)?.delete(listener);
  }

  disconnect() {
    this.disconnectCount += 1;
  }

  emit(event, ...args) {
    for (const listener of this.listeners.get(event) || []) listener(...args);
  }
}

test("server token-expiry disconnect refreshes credentials and resynchronizes after reconnect", async () => {
  const socket = new FakeSocket();
  const updatedTokens = [];
  let refreshes = 0;
  let resyncs = 0;
  installSocketRecovery({
    socket,
    refreshSession: async () => { refreshes += 1; return { data: { accessToken: "fresh-token" } }; },
    updateAccessToken: (token) => updatedTokens.push(token),
    onResync: () => { resyncs += 1; }
  });

  socket.emit("connect");
  socket.emit("disconnect", "io server disconnect");
  await new Promise((resolve) => setImmediate(resolve));
  socket.emit("connect");

  assert.equal(refreshes, 1);
  assert.deepEqual(updatedTokens, ["fresh-token"]);
  assert.equal(resyncs, 1);
});

test("transient network disconnect resynchronizes on automatic reconnection without refreshing auth", async () => {
  const socket = new FakeSocket();
  let refreshes = 0;
  let resyncs = 0;
  installSocketRecovery({
    socket,
    refreshSession: async () => { refreshes += 1; return { data: { accessToken: "unused" } }; },
    updateAccessToken: () => {},
    onResync: () => { resyncs += 1; }
  });

  socket.emit("connect");
  socket.emit("disconnect", "transport close");
  socket.emit("connect");

  assert.equal(refreshes, 0);
  assert.equal(resyncs, 1);
});

test("unauthorized initial socket connection refreshes once and failed refresh clears auth", async () => {
  const socket = new FakeSocket();
  const updatedTokens = [];
  let refreshes = 0;
  const cleanup = installSocketRecovery({
    socket,
    refreshSession: async () => { refreshes += 1; throw new Error("expired refresh cookie"); },
    updateAccessToken: (token) => updatedTokens.push(token),
    onResync: () => {}
  });

  socket.emit("connect_error", new Error("Unauthorized socket connection"));
  socket.emit("connect_error", new Error("Unauthorized socket connection"));
  await new Promise((resolve) => setImmediate(resolve));
  cleanup();

  assert.equal(refreshes, 1);
  assert.deepEqual(updatedTokens, [null]);
  assert.equal(socket.disconnectCount, 1);
});
