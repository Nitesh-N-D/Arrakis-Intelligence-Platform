import test from "node:test";
import assert from "node:assert/strict";
import { generateGemini, getRetryAfterMs, isRetryableGeminiError, mentatSchema, validateMentatOutput } from "../src/services/mentatProvider.js";
import { createFallbackInsight, MentatService } from "../src/services/mentatService.js";

const validOutput = {
  summary: "Your focus was steady this week.",
  dailyRecommendations: ["Protect one morning focus block."],
  warnings: [],
  nextBestAction: "Schedule a 25 minute session tomorrow.",
  focusSchedule: {
    recommendedStartHour: "09:00",
    recommendedPrimarySession: 25,
    recommendedRecoveryWindow: "Take a short break after the session."
  }
};

const fakeClient = (text) => ({ models: { generateContent: async (request) => {
  assert.equal(request.model, "test-model");
  assert.equal(request.config.responseMimeType, "application/json");
  assert.equal(request.config.responseSchema, mentatSchema);
  assert.equal(typeof request.config.systemInstruction, "string");
  assert.equal(request.config.maxOutputTokens, 800);
  return { text };
} } });

test("Gemini accepts and validates structured output", async () => {
  const result = await generateGemini({ apiKey: "test-key", model: "test-model", timeoutMs: 1000, maxOutputTokens: 800, prompt: "aggregated context", client: fakeClient(JSON.stringify(validOutput)) });
  assert.equal(result.summary, validOutput.summary);
  assert.equal(result.focusSchedule.recommendedPrimarySession, 25);
});

test("provider rejects malformed, empty, overlong, and invalid-time output", async () => {
  for (const output of ["", "not json", JSON.stringify({ ...validOutput, summary: "x".repeat(1201) }), JSON.stringify({ ...validOutput, focusSchedule: { ...validOutput.focusSchedule, recommendedStartHour: "25:99" } }), JSON.stringify({ ...validOutput, focusSchedule: { ...validOutput.focusSchedule, recommendedPrimarySession: "25" } })]) {
    await assert.rejects(generateGemini({ apiKey: "test-key", model: "test-model", timeoutMs: 1000, maxOutputTokens: 800, prompt: "context", client: fakeClient(output) }));
  }
  assert.equal(validateMentatOutput(null), null);
});

test("provider timeout aborts the SDK request", async () => {
  let aborted = false;
  const client = { models: { generateContent: ({ config }) => new Promise((_, reject) => {
    config.abortSignal.addEventListener("abort", () => { aborted = true; reject(Object.assign(new Error("aborted"), { name: "AbortError" })); });
  }) } };
  await assert.rejects(generateGemini({ apiKey: "test-key", model: "test-model", timeoutMs: 10, maxOutputTokens: 800, prompt: "context", client }), { code: "ETIMEDOUT" });
  assert.equal(aborted, true);
});

test("only transient Gemini failures are retryable", () => {
  assert.equal(isRetryableGeminiError({ status: 429 }), true);
  assert.equal(isRetryableGeminiError({ status: 503 }), true);
  assert.equal(isRetryableGeminiError({ code: "ECONNRESET" }), true);
  assert.equal(isRetryableGeminiError({ status: 401 }), false);
  assert.equal(isRetryableGeminiError({ code: "INVALID_RESPONSE" }), false);
});

test("Gemini retry delay reads seconds and HTTP-date Retry-After headers", () => {
  const now = Date.parse("2026-01-01T00:00:00Z");
  assert.equal(getRetryAfterMs({ headers: { "retry-after": "2" } }, now), 2000);
  assert.equal(getRetryAfterMs({ headers: new Headers({ "retry-after": "Thu, 01 Jan 2026 00:00:03 GMT" }) }, now), 3000);
  assert.equal(getRetryAfterMs({ headers: { "retry-after": "bad" } }, now), null);
});

const fixtureContext = {
  dashboard: {
    analytics: {
      focusTrend: [], distractionTrend: [],
      performanceSignals: { totalFocusMinutes: 100, totalDistractionMinutes: 20, focusEfficiency: 80, distractionRatio: 0.2 },
      roadmap: { phases: [] }, skillAnalysis: { disciplineMap: [] }
    },
    operative: { focusStreak: 3, preferences: {} }
  },
  prescience: { burnoutRisk: 12, riskBand: "STABLE", averages: { distractionMinutes: 20 } }
};

const createService = (generator) => new MentatService({
  configuration: {
    mentatProvider: "gemini", geminiApiKey: "mock-key", geminiModel: "test-model",
    geminiTimeoutMs: 1000, mentatMaxOutputTokens: 800, mentatMaxRequestsPerUserDay: 20,
    mentatMaxRequestsGlobalDay: 1000
  },
  generator,
  budgetCheck() {},
  analyticsService: { getDashboard: async () => fixtureContext.dashboard },
  prescienceService: { analyze: async () => fixtureContext.prescience }
});

test("Gemini quota exhaustion falls back after one Retry-After-aware retry", async () => {
  let calls = 0;
  const service = createService(async () => {
    calls += 1;
    throw Object.assign(new Error("quota"), { status: 429, headers: { "retry-after": "0" } });
  });
  const result = await service.analyze({ id: "quota-user" }, { question: "help" });
  assert.equal(calls, 2);
  assert.equal(result.provider, "heuristic");
  assert.equal(result.degraded, true);
});

test("Gemini authentication failures fall back without retrying", async () => {
  let calls = 0;
  const service = createService(async () => {
    calls += 1;
    throw Object.assign(new Error("unauthorized"), { status: 401 });
  });
  const result = await service.analyze({ id: "auth-user" });
  assert.equal(calls, 1);
  assert.equal(result.provider, "heuristic");
  assert.equal(result.degraded, true);
});

test("Gemini network failure retries once then returns labeled heuristic guidance", async () => {
  let calls = 0;
  const service = createService(async () => {
    calls += 1;
    throw Object.assign(new Error("network unavailable"), { code: "ECONNRESET" });
  });
  const result = await service.analyze({ id: "network-user" });
  assert.equal(calls, 2);
  assert.equal(result.provider, "heuristic");
  assert.equal(result.degraded, true);
});

test("missing Gemini key keeps Mentat available through labeled heuristic guidance", async () => {
  const service = createService(async () => { throw new Error("must not call provider"); });
  service.configuration.geminiApiKey = "";
  const result = await service.analyze({ id: "missing-key-user" });
  assert.equal(result.provider, "heuristic");
  assert.equal(result.degraded, true);
});

test("heuristic fallback is explicitly labeled and uses authoritative signals", () => {
  const fallback = createFallbackInsight({
    dashboard: { analytics: { focusTrend: [], distractionTrend: [], performanceSignals: { focusEfficiency: 63, distractionRatio: 0.37 }, roadmap: { phases: [] }, skillAnalysis: { disciplineMap: [] } }, operative: { focusStreak: 4, preferences: {} } },
    prescience: { burnoutRisk: 22, riskBand: "STABLE", averages: { distractionMinutes: 35 } },
    question: ""
  });
  assert.equal(fallback.provider, "heuristic");
  assert.equal(fallback.signals.focusEfficiency, 63);
  assert.equal(fallback.signals.streak, 4);
});
