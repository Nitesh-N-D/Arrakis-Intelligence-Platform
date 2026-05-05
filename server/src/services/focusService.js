import { FocusSessionRepository } from "../repositories/FocusSessionRepository.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { RankEngine } from "./rankEngine.js";
import { SpiceEngine } from "./spiceEngine.js";

const focusSessionRepository = new FocusSessionRepository();
const userRepository = new UserRepository();
const spiceEngine = new SpiceEngine();
const rankEngine = new RankEngine();

export class FocusService {
  async createSession(user, payload) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastFocusDate = user.lastFocusDate ? new Date(user.lastFocusDate) : null;
    const lastDay =
      lastFocusDate ? new Date(new Date(lastFocusDate).setHours(0, 0, 0, 0)) : null;
    const streak =
      lastDay && today.getTime() - lastDay.getTime() === 24 * 60 * 60 * 1000
        ? user.focusStreak + 1
        : lastDay && today.getTime() === lastDay.getTime()
          ? user.focusStreak
          : 1;

    const spiceEarned = spiceEngine.calculateHarvest({
      duration: payload.duration,
      productivityScore: payload.productivityScore,
      streak
    });

    const session = await focusSessionRepository.create({
      user: user.id,
      duration: payload.duration,
      type: payload.type,
      productivityScore: payload.productivityScore,
      spiceEarned,
      status: payload.status || "completed",
      startedAt: payload.startedAt ? new Date(payload.startedAt) : new Date(Date.now() - payload.duration * 60000),
      completedAt: payload.completedAt ? new Date(payload.completedAt) : new Date(),
      notes: payload.notes || ""
    });

    const totalSpice = user.totalSpice + spiceEarned;
    const updatedUser = await userRepository.updateById(user.id, {
      totalSpice,
      currentRank: rankEngine.determineRank(totalSpice),
      focusStreak: streak,
      lastFocusDate: new Date()
    });

    return { session, updatedUser };
  }
}
