import axios from "axios";
import { env } from "../config/env.js";
import { AnalyticsService } from "./analyticsService.js";
import { PrescienceService } from "./prescienceService.js";

const analyticsService = new AnalyticsService();
const prescienceService = new PrescienceService();

const planCapabilities = {
  free: {
    maxRecommendations: 2,
    includeChat: false
  },
  pro: {
    maxRecommendations: 4,
    includeChat: true
  }
};

const getTrendDirection = (data, key) => {
  if (!Array.isArray(data) || data.length < 2) {
    return "steady";
  }

  const recent = data.at(-1)?.[key] || 0;
  const previous = data.at(-2)?.[key] || 0;

  if (recent > previous) return "up";
  if (recent < previous) return "down";
  return "steady";
};

const createFallbackInsight = ({ dashboard, prescience, question, capability }) => {
  const focusTrendDirection = getTrendDirection(dashboard.analytics.focusTrend, "totalSpice");
  const stormTrendDirection = getTrendDirection(
    dashboard.analytics.distractionTrend,
    "totalMinutes"
  );
  const focusEfficiency = dashboard.analytics.performanceSignals?.focusEfficiency || 0;
  const distractionRatio = dashboard.analytics.performanceSignals?.distractionRatio || 0;
  const activeRoadmapPhase = dashboard.analytics.roadmap?.phases?.find(
    (phase) => phase.status === "active"
  );
  const topSkill = dashboard.analytics.skillAnalysis?.disciplineMap?.[0];

  const recommendations = [
    focusTrendDirection === "down"
      ? "Your spice trend softened. Protect the next morning with a guaranteed 25-minute harvest before communications."
      : "Your spice trend is stable. Preserve momentum by starting the same time tomorrow.",
    stormTrendDirection === "up"
      ? "Storm pressure is climbing. Add one distracting domain to the blocker before your next deep session."
      : "Storm load is contained. Keep the same blocker perimeter during your highest-value hours.",
    activeRoadmapPhase
      ? `Advance the current ascension phase for ${activeRoadmapPhase.skill} with one task today to avoid roadmap drift.`
      : "Your roadmap is clear. Regenerate a new target role path when you are ready for the next ascension tier.",
    topSkill
      ? `The next best discipline upgrade is ${topSkill.skill} because its priority score is ${topSkill.priorityScore}.`
      : "Your current discipline matrix is aligned. Shift effort from acquisition to execution quality."
  ].slice(0, capability.maxRecommendations);

  const warnings = [];
  if (prescience.burnoutRisk >= 70) {
    warnings.push("Burnout risk is elevated. Reduce context switching and shorten total meeting load.");
  }
  if (distractionRatio >= 0.65) {
    warnings.push("Distraction ratio is too high for compounding work. Tighten storm controls immediately.");
  }

  return {
    provider: "heuristic",
    model: "rule-engine",
    capability,
    question: question || null,
    summary:
      prescience.riskBand === "HIGH RISK"
        ? "Mentat sees a fragile operating rhythm: distractions are consuming too much of your available focus."
        : "Mentat sees a recoverable rhythm with clear leverage in scheduling and disciplined task sequencing.",
    dailyRecommendations: recommendations,
    warnings,
    nextBestAction: activeRoadmapPhase
      ? `Complete one task from ${activeRoadmapPhase.skill} and finish at least one ${dashboard.operative?.preferences?.focusDurationPreference || 25}-minute harvest.`
      : "Secure a 25-minute harvest and log any distraction source that breaks your start ritual.",
    focusSchedule: {
      recommendedStartHour: prescience.averages.distractionMinutes > 100 ? "08:30" : "09:00",
      recommendedPrimarySession: focusEfficiency >= 75 ? 50 : 25,
      recommendedRecoveryWindow: prescience.burnoutRisk >= 70 ? "Take a 15-minute reset after each focus block." : "Use a 5-minute reset between harvests."
    },
    signals: {
      burnoutRisk: prescience.burnoutRisk,
      focusEfficiency,
      distractionRatio,
      streak: dashboard.operative?.focusStreak || 0
    }
  };
};

const tryParseJson = (value) => {
  try {
    return JSON.parse(value);
  } catch (_error) {
    return null;
  }
};

export class MentatService {
  async buildContext(user, question = "") {
    const [dashboard, prescience] = await Promise.all([
      analyticsService.getDashboard(user),
      prescienceService.analyze(user)
    ]);

    const capability =
      planCapabilities[user.billing?.plan || "free"] || planCapabilities.free;

    return { dashboard, prescience, question, capability };
  }

  async analyze(user, payload = {}) {
    const context = await this.buildContext(user, payload.question || "");

    if (env.mentatProvider === "openai" && env.openaiApiKey) {
      try {
        const remote = await this.analyzeWithOpenAI(context);
        return {
          ...remote,
          provider: "openai",
          capability: context.capability,
          upgradeRequired: user.billing?.plan !== "pro"
        };
      } catch (_error) {
        const fallback = createFallbackInsight(context);
        return {
          ...fallback,
          degraded: true,
          degradedReason: "Mentat fell back to heuristic mode because the remote AI provider was unavailable.",
          upgradeRequired: user.billing?.plan !== "pro"
        };
      }
    }

    return {
      ...createFallbackInsight(context),
      upgradeRequired: user.billing?.plan !== "pro"
    };
  }

  async analyzeWithOpenAI(context) {
    const response = await axios.post(
      "https://api.openai.com/v1/responses",
      {
        model: env.openaiModel,
        input: [
          {
            role: "developer",
            content:
              "You are Mentat, a behavioral intelligence analyst. Return strict JSON with keys: summary, dailyRecommendations, warnings, nextBestAction, focusSchedule."
          },
          {
            role: "user",
            content: JSON.stringify(context)
          }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "mentat_analysis",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                summary: { type: "string" },
                dailyRecommendations: {
                  type: "array",
                  items: { type: "string" }
                },
                warnings: {
                  type: "array",
                  items: { type: "string" }
                },
                nextBestAction: { type: "string" },
                focusSchedule: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    recommendedStartHour: { type: "string" },
                    recommendedPrimarySession: { type: "number" },
                    recommendedRecoveryWindow: { type: "string" }
                  },
                  required: [
                    "recommendedStartHour",
                    "recommendedPrimarySession",
                    "recommendedRecoveryWindow"
                  ]
                }
              },
              required: [
                "summary",
                "dailyRecommendations",
                "warnings",
                "nextBestAction",
                "focusSchedule"
              ]
            }
          }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${env.openaiApiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 20_000
      }
    );

    const rawText = response.data?.output_text || "";
    const parsed = tryParseJson(rawText);

    if (!parsed) {
      throw new Error("OpenAI Mentat response was not valid JSON");
    }

    return parsed;
  }
}
