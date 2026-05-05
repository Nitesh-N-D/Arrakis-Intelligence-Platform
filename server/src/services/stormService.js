import { DistractionLogRepository } from "../repositories/DistractionLogRepository.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { StormEngine } from "./stormEngine.js";

const distractionLogRepository = new DistractionLogRepository();
const userRepository = new UserRepository();
const stormEngine = new StormEngine();

export class StormService {
  async logDistraction(user, payload) {
    const log = await distractionLogRepository.create({
      user: user.id,
      appName: payload.appName,
      duration: payload.duration,
      severity: payload.severity || "medium",
      metadata: payload.metadata || {},
      loggedAt: payload.loggedAt ? new Date(payload.loggedAt) : new Date()
    });

    const todayAggregation = await distractionLogRepository.aggregateToday(user.id);
    const totalMinutes = todayAggregation[0]?.totalMinutes || 0;
    const stormState = stormEngine.evaluate({
      totalMinutes,
      thresholdMinutes: user.preferences?.distractionThresholdMinutes
    });

    const updatedUser = await userRepository.updateById(user.id, {
      stormModeActive: stormState.stormModeActive
    });

    return { log, stormState, updatedUser };
  }
}
