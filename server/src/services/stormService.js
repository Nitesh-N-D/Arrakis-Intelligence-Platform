import { ApiError } from "../utils/ApiError.js";
import { DistractionLogRepository } from "../repositories/DistractionLogRepository.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { StormEngine } from "./stormEngine.js";

const distractionLogRepository = new DistractionLogRepository();
const userRepository = new UserRepository();
const stormEngine = new StormEngine();
const validSeverities = ["low", "medium", "high"];

export class StormService {
  async logDistraction(user, payload) {
    const loggedAt = payload.loggedAt ? new Date(payload.loggedAt) : new Date();
    if (Number.isNaN(loggedAt.getTime())) {
      throw new ApiError(400, "Logged timestamp is invalid");
    }

    const duration = Number(payload.duration);
    if (!Number.isFinite(duration) || duration <= 0 || duration > 24 * 60) {
      throw new ApiError(400, "Distraction duration must be between 1 and 1440 minutes");
    }

    const site = String(payload.site || payload.metadata?.site || "").trim();
    const url = String(payload.url || payload.metadata?.url || "").trim();
    const appName = String(payload.appName || site || "Browser").trim();
    if (!appName) {
      throw new ApiError(400, "App or site name is required");
    }

    const severity = validSeverities.includes(payload.severity) ? payload.severity : "medium";

    const log = await distractionLogRepository.create({
      user: user.id,
      appName,
      duration,
      severity,
      loggedAt,
      metadata: {
        device: payload.metadata?.device || payload.device || "desktop",
        category: payload.metadata?.category || payload.category || "general",
        source: payload.metadata?.source || payload.source || "manual",
        site,
        url,
        pageTitle: payload.metadata?.pageTitle || payload.pageTitle || ""
      }
    });

    const todayAggregation = await distractionLogRepository.aggregateToday(user.id);
    const totalMinutes = todayAggregation[0]?.totalMinutes || 0;
    const stormState = stormEngine.evaluate(totalMinutes);

    const updatedUser = await userRepository.updateById(user.id, {
      stormModeActive: stormState.stormModeActive
    });

    return { log, stormState, updatedUser };
  }
}
