import { DistractionLogRepository } from "../repositories/DistractionLogRepository.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { StormEngine } from "./stormEngine.js";

const distractionLogRepository = new DistractionLogRepository();
const userRepository = new UserRepository();
const stormEngine = new StormEngine();

export class StormService {
  async logDistraction(user, payload) {
    const loggedAt = payload.loggedAt ? new Date(payload.loggedAt) : new Date();
    const site = payload.site || payload.metadata?.site || "";
    const url = payload.url || payload.metadata?.url || "";

    const log = await distractionLogRepository.create({
      user: user.id,
      appName: payload.appName || site || "Browser",
      duration: payload.duration,
      severity: payload.severity || "medium",
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
