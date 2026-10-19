import { RoadmapRepository } from "../repositories/RoadmapRepository.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { ApiError } from "../utils/ApiError.js";
import { SkillAnalyzerService } from "./skillAnalyzerService.js";

export class RoadmapService {
  constructor({
    roadmapRepository = new RoadmapRepository(),
    userRepository = new UserRepository(),
    skillAnalyzerService = new SkillAnalyzerService()
  } = {}) {
    Object.assign(this, { roadmapRepository, userRepository, skillAnalyzerService });
  }

  buildRoadmapPhases(user) {
    const analysis = this.skillAnalyzerService.analyze({
      userSkills: user.skills,
      targetRole: user.targetRole
    });

    return analysis.disciplineMap.map((item, index) => ({
      phaseNumber: index + 1,
      skill: item.skill,
      difficulty: item.difficulty,
      priorityScore: item.priorityScore,
      durationWeeks: item.durationWeeks,
      tasks: item.tasks,
      skillLevelAtGeneration: item.currentLevel,
      status: index === 0 ? "active" : "locked",
      startedAt: index === 0 ? new Date() : null,
      completedAt: null
    }));
  }

  async ensureRoadmap(user) {
    let roadmap = await this.roadmapRepository.findByUser(user.id);

    if (roadmap && roadmap.targetRole === user.targetRole) {
      return roadmap;
    }

    const phases = this.buildRoadmapPhases(user);
    const payload = {
      user: user.id,
      targetRole: user.targetRole,
      currentPhaseIndex: phases.findIndex((phase) => phase.status === "active"),
      phases,
      generatedFromSkillSnapshot: user.skills
    };

    if (!roadmap) {
      return this.roadmapRepository.create(payload);
    }

    roadmap.targetRole = payload.targetRole;
    roadmap.currentPhaseIndex = payload.currentPhaseIndex;
    roadmap.phases = payload.phases;
    roadmap.generatedFromSkillSnapshot = payload.generatedFromSkillSnapshot;
    return this.roadmapRepository.save(roadmap);
  }

  async completePhase(user, phaseId) {
    const roadmap = await this.ensureRoadmap(user);
    const phaseIndex = roadmap.phases.findIndex((phase) => phase.id === phaseId);

    if (phaseIndex === -1) {
      throw new ApiError(404, "Roadmap phase not found");
    }

    const phase = roadmap.phases[phaseIndex];

    if (phase.status === "done" || phase.status === "skipped") {
      return roadmap;
    }
    if (phase.status !== "active") {
      throw new ApiError(409, "Only the active roadmap phase can be completed.");
    }

    phase.status = "done";
    phase.completedAt = new Date();

    const nextActiveIndex = roadmap.phases.findIndex(
      (candidate, index) => index > phaseIndex && candidate.status === "locked"
    );

    roadmap.currentPhaseIndex = nextActiveIndex;

    if (nextActiveIndex !== -1) {
      roadmap.phases[nextActiveIndex].status = "active";
      roadmap.phases[nextActiveIndex].startedAt = new Date();
    }

    await this.roadmapRepository.save(roadmap);
    await this.userRepository.replaceSkillLevel(user.id, phase.skill, 4);

    return this.roadmapRepository.findByUser(user.id);
  }
}
