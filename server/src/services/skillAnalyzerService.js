import { roleSkillMatrix } from "../dune/skillMatrix.js";
import { ApiError } from "../utils/ApiError.js";

const difficultyOrder = { easy: 1, medium: 2, hard: 3 };

const tasksByDifficulty = {
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

export class SkillAnalyzerService {
  analyze({ userSkills, targetRole }) {
    const requiredSkills = roleSkillMatrix[targetRole];

    if (!requiredSkills) {
      throw new ApiError(400, `Unknown target role: ${targetRole}`);
    }

    const skillMap = new Map(userSkills.map((skill) => [skill.name.toLowerCase(), skill.level]));

    const weightedSkillScores = requiredSkills.map((requiredSkill) => {
      const currentLevel = skillMap.get(requiredSkill.name.toLowerCase()) || 0;
      const completionRatio = Math.min(currentLevel / 5, 1);
      const basePriority = requiredSkill.weight * 100 * ((5 - currentLevel) / 5);
      const adjustedPriority =
        currentLevel >= 4 ? 0 : currentLevel > 0 ? Number((basePriority * 0.65).toFixed(2)) : Number(basePriority.toFixed(2));
      const status = currentLevel >= 4 ? "mastered" : currentLevel > 0 ? "partial" : "missing";

      return {
        name: requiredSkill.name,
        weight: requiredSkill.weight,
        difficulty: requiredSkill.difficulty,
        currentLevel,
        status,
        gap: Math.max(5 - currentLevel, 0),
        priorityScore: adjustedPriority,
        completionContribution: completionRatio * requiredSkill.weight
      };
    });

    const completion = Math.round(
      weightedSkillScores.reduce((sum, skill) => sum + skill.completionContribution, 0) * 100
    );

    const disciplineMap = weightedSkillScores
      .filter((skill) => skill.status !== "mastered")
      .sort(
        (a, b) =>
          b.priorityScore - a.priorityScore || difficultyOrder[b.difficulty] - difficultyOrder[a.difficulty]
      )
      .map((skill, index) => ({
        phase: index + 1,
        skill: skill.name,
        difficulty: skill.difficulty,
        currentLevel: skill.currentLevel,
        status: skill.status,
        priorityScore: skill.priorityScore,
        durationWeeks: skill.difficulty === "hard" ? 6 : skill.difficulty === "medium" ? 4 : 2,
        tasks: tasksByDifficulty[skill.difficulty](skill.name)
      }));

    return {
      targetRole,
      completion,
      weightedSkillScores,
      missingSkills: disciplineMap.map((skill) => ({
        name: skill.skill,
        difficulty: skill.difficulty,
        priorityScore: skill.priorityScore
      })),
      disciplineMap
    };
  }
}
