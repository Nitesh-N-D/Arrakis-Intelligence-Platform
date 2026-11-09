import { RoadmapRepository } from "../repositories/RoadmapRepository.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { ApiError } from "../utils/ApiError.js";
import { careerForAnalysis } from "./careerProfile.js";
import { SkillAnalyzerService, proficiencyLabel } from "./skillAnalyzerService.js";

export const ROADMAP_LIMITS = Object.freeze({
  notesMax: 4000,
  evidenceSummaryMin: 40,
  evidenceSummaryMax: 1000,
  evidenceUrlMax: 500,
  evidencePerPhase: 10,
  historyEntries: 20
});

const toPlain = (value) => (typeof value?.toObject === "function" ? value.toObject() : { ...value });
const skillKey = (name) => String(name || "").trim().toLowerCase();

export const phaseHasProgress = (phase) =>
  phase.status === "done" ||
  Boolean(phase.notes?.trim()) ||
  (phase.evidence?.length || 0) > 0 ||
  (phase.completedTasks?.length || 0) > 0 ||
  (phase.assessmentConfirmed?.length || 0) > 0 ||
  (phase.bookmarkedResources?.length || 0) > 0;

/** Learning content for a phase. Deterministic: derived from the catalogue, never from an AI provider. */
export function buildPhaseContent({ skill, expectedLevel = 4, why = "", project, resources = [], previousSkill = null }) {
  const label = proficiencyLabel(expectedLevel);
  return {
    objectives: [
      `Reach ${label} proficiency in ${skill}.`,
      why ? `Understand why it matters for this role: ${why}` : `Apply ${skill} in a realistic context.`,
      `Be able to explain your ${skill} decisions to a peer.`
    ],
    prerequisites: previousSkill ? [`Comfortable with ${previousSkill} (previous phase)`] : [],
    resources,
    exercises: [project || `Build a small project that applies ${skill} to a real problem.`],
    assessmentCriteria: [
      `I can explain the core concepts of ${skill} without notes.`,
      `I completed the practical exercise and can describe one trade-off I made.`,
      `I can name what I would improve or learn next in ${skill}.`
    ]
  };
}

function validateEvidenceUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (url.length > ROADMAP_LIMITS.evidenceUrlMax) throw new ApiError(400, "Evidence link is too long.");
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("protocol");
    return parsed.toString();
  } catch (_error) {
    throw new ApiError(400, "Evidence link must be a valid http or https URL.");
  }
}

export class RoadmapService {
  constructor({
    roadmapRepository = new RoadmapRepository(),
    userRepository = new UserRepository(),
    skillAnalyzerService = new SkillAnalyzerService()
  } = {}) {
    Object.assign(this, { roadmapRepository, userRepository, skillAnalyzerService });
  }

  analyzeFor(user, career = careerForAnalysis(user)) {
    return this.skillAnalyzerService.analyze({
      userSkills: user.skills || [],
      targetRole: user.targetRole,
      career,
      allowCustom: true
    });
  }

  /** Builds (unsaved) phases for a career. Statuses are assigned by `assignStatuses`. */
  buildRoadmapPhases(user, career = careerForAnalysis(user)) {
    const analysis = this.analyzeFor(user, career);
    return analysis.disciplineMap.map((item, index, all) => ({
      phaseNumber: index + 1,
      skill: item.skill,
      difficulty: item.difficulty,
      priorityScore: item.priorityScore,
      durationWeeks: item.durationWeeks,
      tasks: item.tasks,
      skillLevelAtGeneration: item.currentLevel,
      status: index === 0 ? "active" : "locked",
      startedAt: index === 0 ? new Date() : null,
      completedAt: null,
      priority: item.priority || null,
      expectedLevel: item.expectedLevel || 4,
      why: String(item.why || "").slice(0, 300),
      ...buildPhaseContent({
        skill: item.skill,
        expectedLevel: item.expectedLevel,
        why: item.why,
        project: item.project,
        resources: item.resources,
        previousSkill: index > 0 ? all[index - 1].skill : null
      }),
      completedTasks: [],
      assessmentConfirmed: [],
      bookmarkedResources: [],
      notes: "",
      evidence: []
    }));
  }

  assignStatuses(phases, now = new Date()) {
    let activeAssigned = false;
    phases.forEach((phase, index) => {
      phase.phaseNumber = index + 1;
      if (phase.status === "done" || phase.status === "skipped") return;
      if (!activeAssigned) {
        phase.status = "active";
        phase.startedAt = phase.startedAt || now;
        activeAssigned = true;
      } else {
        phase.status = "locked";
      }
    });
    return phases.findIndex((phase) => phase.status === "active");
  }

  /**
   * Plans the move from the current roadmap to a new career without losing work:
   *  - completed phases are always kept;
   *  - in-progress work on a skill that the new role also needs is carried over;
   *  - other phases with notes, evidence or progress are archived to history.
   */
  planMigration(roadmap, nextPhases) {
    const existing = roadmap?.phases || [];
    const done = existing.filter((phase) => phase.status === "done" || phase.status === "skipped");
    const doneKeys = new Set(done.map((phase) => skillKey(phase.skill)));
    const openByKey = new Map(
      existing.filter((phase) => !doneKeys.has(skillKey(phase.skill)) && phase.status !== "done" && phase.status !== "skipped")
        .map((phase) => [skillKey(phase.skill), phase])
    );
    const nextKeys = new Set(nextPhases.map((phase) => skillKey(phase.skill)));
    const added = [];
    const carried = [];
    const merged = nextPhases
      .filter((phase) => !doneKeys.has(skillKey(phase.skill)))
      .map((phase) => {
        const previous = openByKey.get(skillKey(phase.skill));
        if (previous && phaseHasProgress(previous)) {
          carried.push(phase.skill);
          return {
            ...phase,
            notes: previous.notes || "",
            evidence: (previous.evidence || []).map(toPlain),
            completedTasks: [...(previous.completedTasks || [])].filter((index) => index < phase.tasks.length),
            assessmentConfirmed: [...(previous.assessmentConfirmed || [])],
            bookmarkedResources: [...(previous.bookmarkedResources || [])],
            startedAt: previous.startedAt || null,
            status: "locked"
          };
        }
        if (!previous) added.push(phase.skill);
        return { ...phase, status: "locked", startedAt: null };
      });
    const archived = existing.filter(
      (phase) => phase.status !== "done" && phase.status !== "skipped" && !nextKeys.has(skillKey(phase.skill)) && phaseHasProgress(phase)
    );
    const removed = existing.filter(
      (phase) => phase.status !== "done" && phase.status !== "skipped" && !nextKeys.has(skillKey(phase.skill))
    );
    return {
      phases: [...done.map(toPlain), ...merged],
      summary: {
        preserved: done.map((phase) => phase.skill),
        carriedOver: carried,
        added,
        archived: archived.map((phase) => phase.skill),
        removed: removed.map((phase) => phase.skill)
      },
      archivedPhases: archived.map(toPlain)
    };
  }

  /** Read-only preview used before a career change is confirmed. */
  async previewCareerChange(user, nextCareer) {
    const roadmap = await this.roadmapRepository.findByUser(user.id);
    const nextPhases = this.buildRoadmapPhases(user, nextCareer);
    const { summary } = this.planMigration(roadmap, nextPhases);
    const hasProgress = Boolean(roadmap?.phases?.some(phaseHasProgress));
    return {
      from: user.career?.title || user.targetRole,
      to: nextCareer.title,
      isCustom: Boolean(nextCareer.isCustom),
      hasProgress,
      requiresConfirmation: hasProgress,
      totalPhases: summary.preserved.length + nextPhases.filter((phase) => !summary.preserved.some((skill) => skillKey(skill) === skillKey(phase.skill))).length,
      ...summary,
      skillsKept: (user.skills || []).length
    };
  }

  async applyCareer(user, nextCareer, reason = "role-change") {
    const roadmap = await this.roadmapRepository.findByUser(user.id);
    const nextPhases = this.buildRoadmapPhases(user, nextCareer);
    if (!roadmap) {
      const currentPhaseIndex = this.assignStatuses(nextPhases);
      return this.roadmapRepository.create({
        user: user.id,
        targetRole: nextCareer.title,
        careerRoleId: nextCareer.roleId || null,
        currentPhaseIndex,
        phases: nextPhases,
        generatedFromSkillSnapshot: user.skills || []
      });
    }
    const { phases, archivedPhases } = this.planMigration(roadmap, nextPhases);
    if (archivedPhases.length > 0) {
      roadmap.history = [
        ...(roadmap.history || []).map(toPlain),
        { targetRole: roadmap.targetRole, reason, archivedAt: new Date(), phases: archivedPhases }
      ].slice(-ROADMAP_LIMITS.historyEntries);
    }
    const previousRole = roadmap.targetRole;
    phases.forEach((phase) => {
      if ((phase.status === "done" || phase.status === "skipped") && !phase.fromRole && previousRole !== nextCareer.title) {
        phase.fromRole = previousRole;
      }
    });
    roadmap.currentPhaseIndex = this.assignStatuses(phases);
    roadmap.phases = phases;
    roadmap.targetRole = nextCareer.title;
    roadmap.careerRoleId = nextCareer.roleId || null;
    roadmap.generatedFromSkillSnapshot = user.skills || [];
    return this.roadmapRepository.save(roadmap);
  }

  /** Adds learning content to phases created by the previous roadmap version. Never changes status. */
  backfillPhaseContent(roadmap) {
    let changed = false;
    roadmap.phases.forEach((phase, index) => {
      if (Array.isArray(phase.assessmentCriteria) && phase.assessmentCriteria.length > 0) return;
      const content = buildPhaseContent({
        skill: phase.skill,
        expectedLevel: phase.expectedLevel || 4,
        why: phase.why,
        previousSkill: index > 0 ? roadmap.phases[index - 1].skill : null
      });
      phase.objectives = content.objectives;
      phase.prerequisites = content.prerequisites;
      phase.exercises = content.exercises;
      phase.assessmentCriteria = content.assessmentCriteria;
      if (!Array.isArray(phase.resources)) phase.resources = [];
      changed = true;
    });
    return changed;
  }

  async ensureRoadmap(user) {
    const roadmap = await this.roadmapRepository.findByUser(user.id);
    // A stored career is used only when it agrees with targetRole; otherwise (legacy data)
    // targetRole is resolved against the catalogue by name.
    const nextCareer = careerForAnalysis(user) || { title: user.targetRole, roleId: null };

    if (!roadmap) {
      return this.applyCareer(user, nextCareer, "initial");
    }
    if (roadmap.targetRole !== user.targetRole) {
      // Previously this silently regenerated every phase and lost progress.
      // Career changes are now confirmed up-front; here we only migrate, preserving work.
      return this.applyCareer(user, nextCareer, "role-change");
    }
    if (this.backfillPhaseContent(roadmap)) {
      return this.roadmapRepository.save(roadmap);
    }
    return roadmap;
  }

  findPhase(roadmap, phaseId) {
    const index = roadmap.phases.findIndex((phase) => String(phase.id ?? phase._id) === String(phaseId));
    if (index === -1) throw new ApiError(404, "Roadmap phase not found");
    return { index, phase: roadmap.phases[index] };
  }

  /** Notes and bookmarks are allowed on any phase; task and assessment progress only on the active one. */
  async updatePhase(user, phaseId, payload = {}) {
    const roadmap = await this.ensureRoadmap(user);
    const { phase } = this.findPhase(roadmap, phaseId);
    const isActive = phase.status === "active";

    if (payload.notes !== undefined) {
      if (typeof payload.notes !== "string" || payload.notes.length > ROADMAP_LIMITS.notesMax) {
        throw new ApiError(400, `Notes must be text of at most ${ROADMAP_LIMITS.notesMax} characters.`);
      }
      phase.notes = payload.notes.replace(/\u0000/g, "");
    }

    if (payload.bookmark !== undefined) {
      const url = String(payload.bookmark?.url || "");
      const known = (phase.resources || []).some((resource) => resource.url === url);
      if (!known) throw new ApiError(400, "Only resources listed in this phase can be bookmarked.");
      const set = new Set(phase.bookmarkedResources || []);
      if (payload.bookmark.bookmarked === false) set.delete(url);
      else set.add(url);
      phase.bookmarkedResources = [...set];
    }

    const toggle = (field, entry, length, label) => {
      if (!isActive) throw new ApiError(409, `Start this phase before updating ${label}.`);
      const index = Number(entry?.index);
      if (!Number.isInteger(index) || index < 0 || index >= length) {
        throw new ApiError(400, `Unknown ${label} item.`);
      }
      const set = new Set(phase[field] || []);
      if (entry.done === false || entry.confirmed === false) set.delete(index);
      else set.add(index);
      phase[field] = [...set].sort((a, b) => a - b);
    };
    if (payload.task !== undefined) toggle("completedTasks", payload.task, phase.tasks.length, "task");
    if (payload.assessment !== undefined) {
      toggle("assessmentConfirmed", payload.assessment, (phase.assessmentCriteria || []).length, "assessment");
    }

    await this.roadmapRepository.save(roadmap);
    return roadmap;
  }

  async addEvidence(user, phaseId, payload = {}) {
    const roadmap = await this.ensureRoadmap(user);
    const { phase } = this.findPhase(roadmap, phaseId);
    if (phase.status !== "active") throw new ApiError(409, "Evidence can only be added to the active phase.");
    const summary = String(payload.summary || "").replace(/\u0000/g, "").trim();
    if (summary.length < ROADMAP_LIMITS.evidenceSummaryMin || summary.length > ROADMAP_LIMITS.evidenceSummaryMax) {
      throw new ApiError(
        400,
        `Describe what you built or learned in ${ROADMAP_LIMITS.evidenceSummaryMin}–${ROADMAP_LIMITS.evidenceSummaryMax} characters.`
      );
    }
    if ((phase.evidence || []).length >= ROADMAP_LIMITS.evidencePerPhase) {
      throw new ApiError(400, `A phase can hold at most ${ROADMAP_LIMITS.evidencePerPhase} evidence entries.`);
    }
    const url = validateEvidenceUrl(payload.url);
    phase.evidence = [...(phase.evidence || []), { summary, url, submittedAt: new Date() }];
    await this.roadmapRepository.save(roadmap);
    return roadmap;
  }

  async removeEvidence(user, phaseId, evidenceId) {
    const roadmap = await this.ensureRoadmap(user);
    const { phase } = this.findPhase(roadmap, phaseId);
    if (phase.status !== "active") throw new ApiError(409, "Evidence on completed phases is kept as a record.");
    const before = (phase.evidence || []).length;
    phase.evidence = (phase.evidence || []).filter((entry) => String(entry.id ?? entry._id) !== String(evidenceId));
    if (phase.evidence.length === before) throw new ApiError(404, "Evidence entry not found");
    await this.roadmapRepository.save(roadmap);
    return roadmap;
  }

  masteryRequirements(phase) {
    const missing = [];
    const taskCount = phase.tasks?.length || 0;
    const completedTasks = new Set(phase.completedTasks || []);
    if ([...Array(taskCount).keys()].some((index) => !completedTasks.has(index))) missing.push("complete every task");
    if ((phase.evidence || []).length === 0) missing.push("submit at least one piece of evidence");
    const criteriaCount = phase.assessmentCriteria?.length || 0;
    const confirmed = new Set(phase.assessmentConfirmed || []);
    if ([...Array(criteriaCount).keys()].some((index) => !confirmed.has(index))) missing.push("confirm every assessment criterion");
    return missing;
  }

  async completePhase(user, phaseId) {
    const roadmap = await this.ensureRoadmap(user);
    const { index: phaseIndex, phase } = this.findPhase(roadmap, phaseId);

    if (phase.status === "done" || phase.status === "skipped") {
      return roadmap;
    }
    if (phase.status !== "active") {
      throw new ApiError(409, "Only the active roadmap phase can be completed.");
    }
    const missing = this.masteryRequirements(phase);
    if (missing.length > 0) {
      throw new ApiError(409, `To mark ${phase.skill} as mastered, ${missing.join(", ")}.`);
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
    // Raises (never lowers) the stored level to the phase's expected proficiency.
    await this.userRepository.replaceSkillLevel(user.id, phase.skill, phase.expectedLevel || 4);

    return this.roadmapRepository.findByUser(user.id);
  }
}
