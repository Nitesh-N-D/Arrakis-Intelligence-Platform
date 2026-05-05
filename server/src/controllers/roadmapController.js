import { RoadmapService } from "../services/roadmapService.js";

const roadmapService = new RoadmapService();

export class RoadmapController {
  async current(req, res) {
    const roadmap = await roadmapService.ensureRoadmap(req.user);
    res.json({ success: true, data: roadmap });
  }

  async completePhase(req, res) {
    const roadmap = await roadmapService.completePhase(req.user, req.params.phaseId);
    res.json({ success: true, data: roadmap });
  }
}
