import test from "node:test";
import assert from "node:assert/strict";
import { StormService } from "../src/services/stormService.js";
import { StormEngine } from "../src/services/stormEngine.js";

test("extension retries with the same source event ID do not double-count", async () => {
  const rows = new Map();
  let updatedUserCalls = 0;
  const distractionLogRepository = {
    async createIdempotent(data) {
      const key = `${data.user}:${data.sourceEventId}`;
      const existing = rows.get(key);
      if (existing) return { log: existing, duplicate: true };
      const log = { ...data, _id: String(rows.size + 1) };
      rows.set(key, log);
      return { log, duplicate: false };
    },
    async aggregateToday() {
      return [{ totalMinutes: [...rows.values()].reduce((sum, row) => sum + row.duration, 0) }];
    }
  };
  const userRepository = {
    async updateById(id, update) { updatedUserCalls += 1; return { id, ...update }; }
  };
  const service = new StormService({ distractionLogRepository, userRepository, stormEngine: new StormEngine() });
  const user = { id: "operative-1" };
  const payload = { sourceEventId: "12345678-1234-4234-8234-123456789abc", duration: 5, appName: "example.com", source: "chrome-extension" };

  const [first, retry] = await Promise.all([
    service.logDistraction(user, payload),
    service.logDistraction(user, { ...payload, duration: 5 })
  ]);

  assert.equal(rows.size, 1);
  assert.equal(first.log._id, retry.log._id);
  assert.equal(first.stormState.totalMinutes, 5);
  assert.equal(retry.stormState.totalMinutes, 5);
  assert.equal(updatedUserCalls, 2);
});

test("legacy URL and page-title fields are accepted but never persisted", async () => {
  let stored;
  const distractionLogRepository = {
    async createIdempotent(data) {
      stored = data;
      return { log: data, duplicate: false };
    },
    async aggregateToday() { return [{ totalMinutes: 1 }]; }
  };
  const userRepository = { async updateById(id, update) { return { id, ...update }; } };
  const service = new StormService({ distractionLogRepository, userRepository });

  const result = await service.logDistraction(
    { id: "operative-1" },
    {
      duration: 1,
      site: "https://Example.com/path?token=private",
      url: "https://example.com/path?token=private",
      pageTitle: "Private page title",
      metadata: {
        site: "https://example.com/metadata?secret=private",
        url: "https://example.com/metadata?secret=private",
        pageTitle: "Private metadata title"
      }
    }
  );

  assert.equal(stored.appName, "example.com");
  assert.deepEqual(stored.metadata, { device: "desktop", category: "general", source: "manual", site: "example.com" });
  assert.deepEqual(result.log.metadata, stored.metadata);
});
