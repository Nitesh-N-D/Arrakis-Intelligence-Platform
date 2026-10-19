import { ApiError } from "../utils/ApiError.js";
import { DistractionLogRepository } from "../repositories/DistractionLogRepository.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { StormEngine } from "./stormEngine.js";

const validSeverities = ["low", "medium", "high"];

export class StormService {
  constructor({
    distractionLogRepository = new DistractionLogRepository(),
    userRepository = new UserRepository(),
    stormEngine = new StormEngine()
  } = {}) {
    Object.assign(this, { distractionLogRepository, userRepository, stormEngine });
  }

  async logDistraction(user, payload) {
    const now = new Date();
    const loggedAt = payload.loggedAt ? new Date(payload.loggedAt) : new Date();
    if (Number.isNaN(loggedAt.getTime())) {
      throw new ApiError(400, "Logged timestamp is invalid");
    }
    if (loggedAt.getTime() > now.getTime() + 5 * 60_000 || loggedAt.getTime() < now.getTime() - 30 * 24 * 60 * 60_000) {
      throw new ApiError(400, "Logged timestamp must be within the last 30 days and cannot be in the future.");
    }

    const duration = Number(payload.duration);
    if (!Number.isFinite(duration) || duration <= 0 || duration > 24 * 60) {
      throw new ApiError(400, "Distraction duration must be between 1 and 1440 minutes");
    }

    const site = String(payload.site || payload.metadata?.site || "").trim().slice(0, 255);
    const url = String(payload.url || payload.metadata?.url || "").trim().slice(0, 2048);
    const appName = String(payload.appName || site || "Browser").trim().slice(0, 160);
    if (!appName) {
      throw new ApiError(400, "App or site name is required");
    }

    const severity = validSeverities.includes(payload.severity) ? payload.severity : "medium";
    const sourceEventId = payload.sourceEventId ? String(payload.sourceEventId).trim() : undefined;
    if (sourceEventId && !/^[a-zA-Z0-9-]{16,80}$/.test(sourceEventId)) {
      throw new ApiError(400, "Source event ID is invalid");
    }

    const { log } = await this.distractionLogRepository.createIdempotent({
      user: user.id,
      ...(sourceEventId ? { sourceEventId } : {}),
      appName,
      duration,
      severity,
      loggedAt,
      metadata: {
        device: String(payload.metadata?.device || payload.device || "desktop").slice(0, 40),
        category: String(payload.metadata?.category || payload.category || "general").slice(0, 80),
        source: String(payload.metadata?.source || payload.source || "manual").slice(0, 80),
        site,
        url,
        pageTitle: String(payload.metadata?.pageTitle || payload.pageTitle || "").slice(0, 300)
      }
    });

    const todayAggregation = await this.distractionLogRepository.aggregateToday(user.id);
    const totalMinutes = todayAggregation[0]?.totalMinutes || 0;
    const stormState = this.stormEngine.evaluate(totalMinutes);

    const updatedUser = await this.userRepository.updateById(user.id, {
      stormModeActive: stormState.stormModeActive
    });

    return { log, stormState, updatedUser };
  }
}
