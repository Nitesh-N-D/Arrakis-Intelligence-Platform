import { AnalyticsService } from "../services/analyticsService.js";

const analyticsService = new AnalyticsService();

export class AnalyticsController {
  async dashboard(req, res) {
    const dashboard = await analyticsService.getDashboard(req.user);
    res.json({ success: true, data: dashboard });
  }
}
