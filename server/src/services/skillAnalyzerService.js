import { PROFICIENCY_LEVELS, SKILL_LIBRARY } from "../data/careerRoles.js";
import { ApiError } from "../utils/ApiError.js";
import { resolveCareerProfile } from "./careerProfile.js";

const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
const priorityOrder = { core: 3, important: 2, supporting: 1 };
const baseWeeksByDifficulty = { hard: 6, medium: 4, easy: 2 };

export const tasksByDifficulty = {
  easy: (skill) => [
    `Complete one guided primer for ${skill}`,
    `Practice ${skill} with a narrow scoped exercise`,
    `Ship one lightweight proof of skill in ${skill}`
  ],
  medium: (skill) => [
    `Complete a structured course or handbook for ${skill}`,
    `Build a production-shaped feature centered on ${skill}`,
    `Review output quality with retrospective notes for ${skill}`
  ],
  hard: (skill) => [
    `Study core architecture patterns and tradeoffs in ${skill}`,
    `Build a system-level project demonstrating ${skill}`,
    `Document decisions, failures, and refinements for ${skill}`
  ]
};

export function proficiencyLabel(level) {
  if (!level) return "Not started";
  return PROFICIENCY_LEVELS.find((entry) => entry.level === Math.round(level))?.label || "Not started";
}

/** Coarse bands deliberately avoid presenting false precision to users. */
export function readinessBand(percent) {
  if (percent >= 85) return "Role-ready";
  if (percent >= 60) return "Solid foundation";
  if (percent >= 30) return "Building";
  return "Getting started";
}

function priorityBand(skill) {
  if (skill.status === "mastered") return "met";
  if (skill.priority === "core" && skill.currentLevel < skill.expectedLevel - 1) return "high";
  if (skill.priority === "supporting") return "low";
  return skill.status === "missing" ? "high" : "medium";
}

function libraryEntry(skill) {
  return skill.skillId ? SKILL_LIBRARY[skill.skillId] : null;
}

export class SkillAnalyzerService {
  validateUserSkills(userSkills) {
    if (!Array.isArray(userSkills) || userSkills.length > 100) {
      throw new ApiError(400, "Skills must be an array containing no more than 100 entries.");
    }
    return userSkills.map((skill) => {
      const name = typeof skill?.name === "string" ? skill.name.trim() : "";
      const level = Number(skill?.level);
      if (!name || name.length > 80 || !Number.isFinite(level) || level < 1 || level > 5) {
        throw new ApiError(400, "Each skill needs a name of 1–80 characters and a level from 1 to 5.");
      }
      return { name: name.toLowerCase(), level };
    });
  }

  /**
   * @param {object} input
   * @param {Array} input.userSkills  [{name, level 1-5}]
   * @param {string} input.targetRole legacy role string (catalogue name/alias, or custom title when allowCustom)
   * @param {object} [input.career]   stored career profile (takes precedence over targetRole)
   * @param {boolean} [input.allowCustom] treat unknown targetRole strings as custom roles instead of rejecting
   */
  analyze({ userSkills, targetRole, career = null, allowCustom = false }) {
    const profile = resolveCareerProfile({ targetRole, career, allowCustom });
    const normalizedSkills = this.validateUserSkills(userSkills);
    const skillMap = new Map(normalizedSkills.map((skill) => [skill.name, skill.level]));

    const weightedSkillScores = profile.requirements.map((requiredSkill) => {
      const currentLevel = skillMap.get(requiredSkill.name.toLowerCase()) || 0;
      const expectedLevel = requiredSkill.expectedLevel;
      const basePriority = requiredSkill.weight * 100 * ((5 - currentLevel) / 5);
      const status = currentLevel >= expectedLevel ? "mastered" : currentLevel > 0 ? "partial" : "missing";
      const adjustedPriority =
        status === "mastered" ? 0 : currentLevel > 0 ? Number((basePriority * 0.65).toFixed(2)) : Number(basePriority.toFixed(2));
      const scored = {
        name: requiredSkill.name,
        weight: requiredSkill.weight,
        priority: requiredSkill.priority,
        difficulty: requiredSkill.difficulty,
        currentLevel,
        currentLabel: proficiencyLabel(currentLevel),
        expectedLevel,
        expectedLabel: proficiencyLabel(expectedLevel),
        status,
        gap: Math.max(expectedLevel - currentLevel, 0),
        priorityScore: adjustedPriority,
        why: requiredSkill.why,
        skillId: requiredSkill.skillId,
        completionContribution: Math.min(currentLevel / expectedLevel, 1) * requiredSkill.weight
      };
      scored.priorityBand = priorityBand(scored);
      return scored;
    });

    const totalWeight = weightedSkillScores.reduce((sum, skill) => sum + skill.weight, 0);
    const rawCompletion = totalWeight > 0
      ? weightedSkillScores.reduce((sum, skill) => sum + skill.completionContribution, 0) / totalWeight
      : 0;
    // Rounded to the nearest 5% — the inputs are self-assessed, so finer precision would mislead.
    const completion = Math.round(rawCompletion * 20) * 5;

    const disciplineMap = weightedSkillScores
      .filter((skill) => skill.status !== "mastered")
      .sort(
        (a, b) =>
          b.priorityScore - a.priorityScore ||
          priorityOrder[b.priority] - priorityOrder[a.priority] ||
          difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
      )
      .map((skill, index) => {
        const library = libraryEntry(skill);
        const baseWeeks = baseWeeksByDifficulty[skill.difficulty] || 4;
        return {
          phase: index + 1,
          skill: skill.name,
          difficulty: skill.difficulty,
          priority: skill.priority,
          priorityBand: skill.priorityBand,
          currentLevel: skill.currentLevel,
          currentLabel: skill.currentLabel,
          expectedLevel: skill.expectedLevel,
          expectedLabel: skill.expectedLabel,
          status: skill.status,
          priorityScore: skill.priorityScore,
          durationWeeks: skill.status === "partial" ? Math.max(1, Math.round(baseWeeks / 2)) : baseWeeks,
          tasks: tasksByDifficulty[skill.difficulty](skill.name),
          why: skill.why,
          project: library?.project || `Build a small project that applies ${skill.name} to a real problem.`,
          resources: library?.resources || []
        };
      });

    const totalWeeks = disciplineMap.reduce((sum, item) => sum + item.durationWeeks, 0);
    const timeline = profile.timelineMonths
      ? {
          targetMonths: profile.timelineMonths,
          estimatedWeeks: totalWeeks,
          fit: totalWeeks <= profile.timelineMonths * 4.3 ? "fits" : "stretch",
          note: totalWeeks <= profile.timelineMonths * 4.3
            ? "The suggested plan fits your timeline at a steady pace."
            : "The full plan is longer than your timeline. Focus on core skills first, or extend the timeline."
        }
      : { targetMonths: null, estimatedWeeks: totalWeeks, fit: "unset", note: "Set a target timeline to see whether the plan fits." };

    return {
      targetRole: profile.title,
      career: {
        roleId: profile.roleId,
        title: profile.title,
        category: profile.category,
        isCustom: profile.isCustom,
        experienceLevel: profile.experienceLevel,
        targetLevel: profile.targetLevel,
        timelineMonths: profile.timelineMonths
      },
      needsSkills: profile.requirements.length === 0,
      completion,
      readiness: readinessBand(completion),
      weightedSkillScores: weightedSkillScores.map(({ completionContribution, ...rest }) => rest),
      missingSkills: disciplineMap.map((skill) => ({
        name: skill.skill,
        difficulty: skill.difficulty,
        priorityScore: skill.priorityScore
      })),
      practicalProjects: disciplineMap.slice(0, 3).map((item) => ({ skill: item.skill, project: item.project })),
      timeline,
      disciplineMap
    };
  }
}
