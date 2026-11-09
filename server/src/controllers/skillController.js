import { roleSkillMatrix } from "../dune/skillMatrix.js";
import { careerForAnalysis } from "../services/careerProfile.js";
import { SkillAnalyzerService } from "../services/skillAnalyzerService.js";

const skillAnalyzerService = new SkillAnalyzerService();

export class SkillController {
  async analyze(req, res) {
    // An explicit targetRole must be a catalogue role; without one, the user's own
    // (possibly custom) career is analysed.
    const explicitRole = req.body?.targetRole;
    const analysis = skillAnalyzerService.analyze({
      userSkills: req.body?.skills || req.user.skills,
      targetRole: explicitRole || req.user.targetRole,
      career: explicitRole ? null : careerForAnalysis(req.user),
      allowCustom: !explicitRole
    });

    res.json({ success: true, data: analysis });
  }

  async matrix(_req, res) {
    res.json({ success: true, data: roleSkillMatrix });
  }
}
