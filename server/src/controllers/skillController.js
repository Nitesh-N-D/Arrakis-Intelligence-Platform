import { roleSkillMatrix } from "../dune/skillMatrix.js";
import { SkillAnalyzerService } from "../services/skillAnalyzerService.js";

const skillAnalyzerService = new SkillAnalyzerService();

export class SkillController {
  async analyze(req, res) {
    const analysis = skillAnalyzerService.analyze({
      userSkills: req.body.skills || req.user.skills,
      targetRole: req.body.targetRole || req.user.targetRole
    });

    res.json({ success: true, data: analysis });
  }

  async matrix(_req, res) {
    res.json({ success: true, data: roleSkillMatrix });
  }
}
