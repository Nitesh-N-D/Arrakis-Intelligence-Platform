import { UserRepository } from "../repositories/UserRepository.js";
import { ApiError } from "../utils/ApiError.js";
import { normalizeCareerInput, serializeCareer } from "./careerProfile.js";
import { RoadmapService } from "./roadmapService.js";
import { SkillAnalyzerService } from "./skillAnalyzerService.js";

const HISTORY_LIMIT = 20;

export class CareerService {
  constructor({
    userRepository = new UserRepository(),
    roadmapService = new RoadmapService(),
    skillAnalyzerService = new SkillAnalyzerService()
  } = {}) {
    Object.assign(this, { userRepository, roadmapService, skillAnalyzerService });
  }

  getCareer(user) {
    return serializeCareer(user);
  }

  async preview(user, payload) {
    const nextCareer = normalizeCareerInput(payload);
    const [impact, analysis] = await Promise.all([
      this.roadmapService.previewCareerChange(user, nextCareer),
      Promise.resolve(this.skillAnalyzerService.analyze({
        userSkills: user.skills || [],
        targetRole: nextCareer.title,
        career: nextCareer,
        allowCustom: true
      }))
    ]);
    return { career: nextCareer, impact, analysis };
  }

  /**
   * Saves a career selection. If the current roadmap holds progress, the caller must
   * pass `confirmRoadmapChange: true` after showing the preview — otherwise 409 + preview.
   * Skills and completed phases are always kept.
   */
  isSameRole(user, nextCareer) {
    const current = serializeCareer(user);
    return current.title === nextCareer.title && current.roleId === nextCareer.roleId;
  }

  /** Throws 409 when a role change would alter a roadmap that holds progress and was not confirmed. */
  async assertChangeAllowed(user, nextCareer, confirmed) {
    if (this.isSameRole(user, nextCareer)) return;
    const impact = await this.roadmapService.previewCareerChange(user, nextCareer);
    if (impact.requiresConfirmation && confirmed !== true) {
      throw new ApiError(409, "Review and confirm the roadmap change before switching careers.", impact);
    }
  }

  async update(user, payload = {}) {
    const nextCareer = normalizeCareerInput(payload.career ?? payload);
    const current = serializeCareer(user);
    const sameRole = this.isSameRole(user, nextCareer);
    await this.assertChangeAllowed(user, nextCareer, payload.confirmRoadmapChange);

    const history = (user.careerHistory || []).map((entry) => entry.toObject?.() || entry);
    if (!sameRole && current.title) {
      history.push({ roleId: current.roleId, title: current.title, changedAt: new Date() });
    }

    const updated = await this.userRepository.updateById(user.id, {
      targetRole: nextCareer.title,
      career: { ...nextCareer, selectionPending: false, selectedAt: new Date() },
      careerHistory: history.slice(-HISTORY_LIMIT)
    });
    if (!updated) throw new ApiError(404, "User not found");

    // Same role with new preferences (level/timeline) still re-plans, preserving all progress.
    const roadmap = await this.roadmapService.applyCareer(updated, nextCareer, sameRole ? "preferences-change" : "role-change");

    return { career: serializeCareer(updated), roadmap };
  }
}
