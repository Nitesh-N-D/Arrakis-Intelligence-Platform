import { RoadmapService } from "../services/roadmapService.js";

const roadmapService = new RoadmapService();

export class RoadmapController {
  async current(req, res) {
    const roadmap = await roadmapService.ensureRoadmap(req.user);
    res.json({ success: true, data: roadmap });
  }

  async updatePhase(req, res) {
    const roadmap = await roadmapService.updatePhase(req.user, req.params.phaseId, req.body || {});
    res.json({ success: true, data: roadmap });
  }

  async addEvidence(req, res) {
    const roadmap = await roadmapService.addEvidence(req.user, req.params.phaseId, req.body || {});
    res.status(201).json({ success: true, data: roadmap, message: "Evidence added" });
  }

  async removeEvidence(req, res) {
    const roadmap = await roadmapService.removeEvidence(req.user, req.params.phaseId, req.params.evidenceId);
    res.json({ success: true, data: roadmap });
  }

  async completePhase(req, res) {
    const roadmap = await roadmapService.completePhase(req.user, req.params.phaseId);
    res.json({ success: true, data: roadmap });
  }
}
