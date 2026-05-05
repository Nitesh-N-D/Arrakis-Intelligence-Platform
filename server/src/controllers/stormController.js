import { getIo } from "../socket/index.js";
import { AnalyticsService } from "../services/analyticsService.js";
import { StormService } from "../services/stormService.js";

const stormService = new StormService();
const analyticsService = new AnalyticsService();

export class StormController {
  async log(req, res) {
    const result = await stormService.logDistraction(req.user, req.body);
    const io = getIo();

    if (io) {
      io.to(`user:${req.user.id}`).emit("storm:update", result.stormState);
      io.to(`user:${req.user.id}`).emit(
        "analytics:update",
        await analyticsService.getDashboard(result.updatedUser)
      );
    }

    res.status(201).json({
      success: true,
      data: {
        log: result.log,
        stormState: result.stormState
      }
    });
  }
}
