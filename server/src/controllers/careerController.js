import {
  CAREER_CATALOGUE_VERSION,
  CAREER_CATEGORIES,
  CAREER_ROLES,
  EXPERIENCE_LEVELS,
  TIMELINE_OPTIONS,
  suggestSkillsForTitle
} from "../data/careerRoles.js";
import { CareerService } from "../services/careerService.js";
import { cleanText, CAREER_LIMITS } from "../services/careerProfile.js";

const careerService = new CareerService();

export class CareerController {
  async catalogue(_req, res) {
    res.json({
      success: true,
      data: {
        version: CAREER_CATALOGUE_VERSION,
        categories: CAREER_CATEGORIES,
        experienceLevels: EXPERIENCE_LEVELS,
        timelines: TIMELINE_OPTIONS,
        roles: CAREER_ROLES
      }
    });
  }

  async current(req, res) {
    res.json({ success: true, data: careerService.getCareer(req.user) });
  }

  async preview(req, res) {
    const data = await careerService.preview(req.user, req.body?.career ?? req.body);
    res.json({ success: true, data });
  }

  async update(req, res) {
    const data = await careerService.update(req.user, req.body);
    res.json({ success: true, data, message: "Career updated" });
  }

  /** Deterministic catalogue-based suggestions for a custom title. Nothing is saved. */
  async suggestSkills(req, res) {
    const title = cleanText(req.body?.title, {
      field: "Custom role title",
      required: true,
      min: CAREER_LIMITS.titleMin,
      max: CAREER_LIMITS.titleMax
    });
    res.json({ success: true, data: { ...suggestSkillsForTitle(title), source: "catalogue" } });
  }
}
