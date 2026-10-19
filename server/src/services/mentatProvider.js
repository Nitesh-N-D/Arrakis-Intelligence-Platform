import { GoogleGenAI } from "@google/genai";

export const mentatSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    dailyRecommendations: { type: "array", items: { type: "string" } },
    warnings: { type: "array", items: { type: "string" } },
    nextBestAction: { type: "string" },
    focusSchedule: {
      type: "object",
      properties: {
        recommendedStartHour: { type: "string" },
        recommendedPrimarySession: { type: "integer" },
        recommendedRecoveryWindow: { type: "string" }
      },
      required: ["recommendedStartHour", "recommendedPrimarySession", "recommendedRecoveryWindow"]
    }
  },
  required: ["summary", "dailyRecommendations", "warnings", "nextBestAction", "focusSchedule"]
};

const boundedText = (value, max) => {
  if (typeof value !== "string" || !value.trim() || value.length > max) return null;
  return value.trim();
};

export const validateMentatOutput = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const summary = boundedText(value.summary, 1200);
  const nextBestAction = boundedText(value.nextBestAction, 500);
  const schedule = value.focusSchedule;
  const time = typeof schedule?.recommendedStartHour === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(schedule.recommendedStartHour)
    ? schedule.recommendedStartHour : null;
  const duration = schedule?.recommendedPrimarySession;
  const recovery = boundedText(schedule?.recommendedRecoveryWindow, 240);
  const list = (items) => Array.isArray(items) && items.length <= 4 && items.every((item) => boundedText(item, 300))
    ? items.map((item) => item.trim()) : null;
  const dailyRecommendations = list(value.dailyRecommendations);
  const warnings = list(value.warnings);
  if (!summary || !nextBestAction || !time || typeof duration !== "number" || ![25, 50].includes(duration) || !recovery || !dailyRecommendations || !warnings) return null;
  return { summary, dailyRecommendations, warnings, nextBestAction, focusSchedule: {
    recommendedStartHour: time, recommendedPrimarySession: duration, recommendedRecoveryWindow: recovery
  } };
};

export const generateGemini = async ({ apiKey, model, timeoutMs, maxOutputTokens, prompt, systemInstruction = "Return only valid JSON matching the required schema.", client }) => {
  const ai = client || new GoogleGenAI({ apiKey });
  const controller = new AbortController();
  let timer;
  try {
    const request = ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: mentatSchema,
        maxOutputTokens,
        abortSignal: controller.signal
      }
    });
    const response = await Promise.race([
      request,
      new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(Object.assign(new Error("timeout"), { code: "ETIMEDOUT" })); }, timeoutMs); })
    ]);
    const raw = typeof response.text === "function" ? response.text() : response.text;
    if (typeof raw !== "string" || !raw.trim()) throw Object.assign(new Error("empty response"), { code: "EMPTY_RESPONSE" });
    let parsed;
    try { parsed = JSON.parse(raw); } catch { throw Object.assign(new Error("malformed response"), { code: "INVALID_RESPONSE" }); }
    const validated = validateMentatOutput(parsed);
    if (!validated) throw Object.assign(new Error("response failed validation"), { code: "INVALID_RESPONSE" });
    return validated;
  } catch (error) {
    if (controller.signal.aborted && error?.code !== "ETIMEDOUT") {
      throw Object.assign(new Error("Gemini request timed out"), { code: "ETIMEDOUT" });
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

export const isRetryableGeminiError = (error) => {
  const status = Number(error?.status || error?.statusCode || error?.response?.status);
  return error?.code === "ETIMEDOUT" || error?.code === "ECONNRESET" || error?.code === "ECONNREFUSED" || status === 429 || status >= 500;
};

export const getRetryAfterMs = (error, now = Date.now()) => {
  const headers = error?.headers || error?.response?.headers;
  const value = headers?.get?.("retry-after") ?? headers?.["retry-after"] ?? headers?.["Retry-After"];
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(String(value));
  return Number.isFinite(date) ? Math.max(0, date - now) : null;
};
