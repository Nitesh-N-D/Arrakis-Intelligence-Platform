export class StormEngine {
  evaluate(totalMinutes) {
    if (totalMinutes < 60) {
      return {
        stormModeActive: false,
        stormLevel: "CALM",
        escalationLevel: "CALM",
        totalMinutes,
        nextThreshold: 60
      };
    }

    if (totalMinutes < 120) {
      return {
        stormModeActive: true,
        stormLevel: "DUST",
        escalationLevel: "DUST",
        totalMinutes,
        nextThreshold: 120
      };
    }

    if (totalMinutes < 180) {
      return {
        stormModeActive: true,
        stormLevel: "SANDSTORM",
        escalationLevel: "SANDSTORM",
        totalMinutes,
        nextThreshold: 180
      };
    }

    return {
      stormModeActive: true,
      stormLevel: "SPICE STORM",
      escalationLevel: "SPICE STORM",
      totalMinutes,
      nextThreshold: null
    };
  }
}
