export class SpiceEngine {
  calculateHarvest({ duration, productivityScore, streak }) {
    const durationMultiplier = duration >= 50 ? 1.5 : duration >= 25 ? 1.15 : 1;
    const productivityMultiplier = 0.6 + productivityScore / 100;
    const streakBonus = Math.min(streak * 2, 20);
    return Math.round(duration * durationMultiplier * productivityMultiplier + streakBonus);
  }
}
