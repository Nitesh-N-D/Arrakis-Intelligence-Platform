import { UserRepository } from "../repositories/UserRepository.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const startOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const diffInDays = (current, previous) =>
  Math.round((startOfDay(current).getTime() - startOfDay(previous).getTime()) / DAY_IN_MS);

const userRepository = new UserRepository();

export class OperativeStateService {
  getCurrentStreak(user, referenceDate = new Date()) {
    if (!user.lastActiveDate) {
      return 0;
    }

    const daysSinceLastActive = diffInDays(referenceDate, user.lastActiveDate);

    if (daysSinceLastActive > 1) {
      return 0;
    }

    return user.focusStreak || 0;
  }

  computeNextStreak(user, completionDate = new Date()) {
    if (!user.lastActiveDate) {
      return 1;
    }

    const dayDifference = diffInDays(completionDate, user.lastActiveDate);

    if (dayDifference === 0) {
      return Math.max(user.focusStreak || 0, 1);
    }

    if (dayDifference === 1) {
      return (user.focusStreak || 0) + 1;
    }

    return 1;
  }

  async syncUserState(user, referenceDate = new Date()) {
    const currentStreak = this.getCurrentStreak(user, referenceDate);

    if (currentStreak !== (user.focusStreak || 0)) {
      return userRepository.updateById(user.id, { focusStreak: currentStreak });
    }

    return user;
  }
}
