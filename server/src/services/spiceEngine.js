export class SpiceEngine {
  calculateHarvest(duration) {
    if (duration >= 50) {
      return 25;
    }

    if (duration >= 25) {
      return 10;
    }

    return Math.max(0, Math.round(duration / 5));
  }
}
