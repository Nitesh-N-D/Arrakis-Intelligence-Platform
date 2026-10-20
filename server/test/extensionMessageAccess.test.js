import test from "node:test";
import assert from "node:assert/strict";

const createEvent = () => ({ listener: null, addListener(listener) { this.listener = listener; } });

test("extension settings are returned only to pages belonging to this extension", async () => {
  const previousChrome = globalThis.chrome;
  const stored = { jwtToken: "extension-access-token" };
  let storageReads = 0;
  const onMessage = createEvent();
  globalThis.chrome = {
    runtime: {
      getURL: (path) => `chrome-extension://arrakis-test-id/${path}`,
      onInstalled: createEvent(),
      onStartup: createEvent(),
      onMessage
    },
    alarms: { onAlarm: createEvent() },
    tabs: { onActivated: createEvent(), onUpdated: createEvent() },
    storage: {
      local: {
        async get(keys) {
          storageReads += 1;
          if (Array.isArray(keys)) return Object.fromEntries(keys.filter((key) => key in stored).map((key) => [key, stored[key]]));
          return { ...stored };
        },
        async set(values) { Object.assign(stored, values); }
      }
    }
  };

  try {
    await import(`../../extension/background.js?settings-access-test=${Date.now()}`);
    const send = (senderUrl) => new Promise((resolve) => {
      onMessage.listener({ type: "GET_SETTINGS" }, { url: senderUrl }, resolve);
    });

    const denied = await send("https://attacker.example/page");
    assert.deepEqual(denied, { ok: false, error: "Untrusted extension page" });
    assert.equal(storageReads, 0);

    const allowed = await send("chrome-extension://arrakis-test-id/popup.html");
    assert.equal(allowed.ok, true);
    assert.equal(allowed.settings.jwtToken, "extension-access-token");
    assert.ok(storageReads > 0);
  } finally {
    globalThis.chrome = previousChrome;
  }
});
