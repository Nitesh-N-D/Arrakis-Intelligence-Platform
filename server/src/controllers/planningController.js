import { GoalService } from "../services/goalService.js";
import { MissionService } from "../services/missionService.js";

const missionService = new MissionService();
const goalService = new GoalService();

export class MissionController {
  async board(req, res) {
    res.json({ success: true, data: await missionService.getBoard(req.user, req.query) });
  }

  async create(req, res) {
    res.status(201).json({ success: true, data: await missionService.create(req.user, req.body), message: "Mission added" });
  }

  async update(req, res) {
    res.json({ success: true, data: await missionService.update(req.user, req.params.missionId, req.body) });
  }

  async remove(req, res) {
    res.json({ success: true, data: await missionService.remove(req.user, req.params.missionId) });
  }

  async carryForward(req, res) {
    res.json({ success: true, data: await missionService.carryForward(req.user, req.body) });
  }
}

export class GoalController {
  async list(req, res) {
    res.json({ success: true, data: await goalService.list(req.user) });
  }

  async create(req, res) {
    res.status(201).json({ success: true, data: await goalService.create(req.user, req.body), message: "Goal created" });
  }

  async update(req, res) {
    res.json({ success: true, data: await goalService.update(req.user, req.params.goalId, req.body) });
  }

  async toggleMilestone(req, res) {
    res.json({
      success: true,
      data: await goalService.toggleMilestone(req.user, req.params.goalId, req.params.milestoneId, req.body?.done)
    });
  }

  async remove(req, res) {
    res.json({ success: true, data: await goalService.remove(req.user, req.params.goalId) });
  }
}
