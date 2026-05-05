import { PrescienceService } from "../services/prescienceService.js";

const prescienceService = new PrescienceService();

export class PrescienceController {
  async analyze(req, res) {
    const analysis = await prescienceService.analyze(req.user);
    res.json({ success: true, data: analysis });
  }
}
