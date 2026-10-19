import test from "node:test";
import assert from "node:assert/strict";
import { fillDailySeries } from "../src/services/dailySeries.js";
import { FocusService } from "../src/services/focusService.js";
import { OperativeStateService } from "../src/services/operativeStateService.js";
import { SpiceEngine } from "../src/services/spiceEngine.js";
import { StormEngine } from "../src/services/stormEngine.js";

test("focus reward tiers and duration validation stay bounded", () => {
  const spice = new SpiceEngine();
  assert.equal(spice.calculateHarvest(25), 10);
  assert.equal(spice.calculateHarvest(50), 25);
  assert.throws(() => new FocusService().validateSession({ duration: 500 }), { statusCode: 400 });
});

test("storm thresholds classify boundaries and malformed values safely", () => {
  const storm = new StormEngine();
  assert.equal(storm.evaluate(59).stormLevel, "CALM");
  assert.equal(storm.evaluate(60).stormLevel, "DUST");
  assert.equal(storm.evaluate(120).stormLevel, "SANDSTORM");
  assert.equal(storm.evaluate(180).stormLevel, "SPICE STORM");
  assert.equal(storm.evaluate(Number.NaN).totalMinutes, 0);
});

test("streak boundaries use UTC calendar days", () => {
  const service = new OperativeStateService();
  const user = { focusStreak: 3, lastActiveDate: new Date("2026-03-08T23:55:00Z") };
  assert.equal(service.computeNextStreak(user, new Date("2026-03-09T00:05:00Z")), 4);
  assert.equal(service.computeNextStreak(user, new Date("2026-03-10T00:05:00Z")), 1);
});

test("daily trends include empty days and UTC dates", () => {
  const result = fillDailySeries([{ _id: "2026-03-09", totalMinutes: 12 }], 3, new Date("2026-03-10T23:00:00Z"));
  assert.deepEqual(result.map((row) => row._id), ["2026-03-08", "2026-03-09", "2026-03-10"]);
  assert.equal(result[0].totalMinutes, 0);
  assert.equal(result[1].totalMinutes, 12);
});
