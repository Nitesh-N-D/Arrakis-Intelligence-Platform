import { roleSkillMatrix } from "../dune/skillMatrix.js";
import { ApiError } from "../utils/ApiError.js";

const difficultyRank = { easy: 1, medium: 2, hard: 3 };

export class SkillAnalyzerService {
  analyze({ userSkills, targetRole }) {
    const matrix = roleSkillMatrix[targetRole];
    if (!matrix) {
      throw new ApiError(400, `Unknown target role: ${targetRole}`);
    }

    const userSkillMap = new Map(userSkills.map((skill) => [skill.name.toLowerCase(), skill.level]));
    const weightedSkillScores = matrix.map((requiredSkill) => {
      const currentLevel = userSkillMap.get(requiredSkill.name.toLowerCase()) || 0;
      const normalizedLevel = Math.min(currentLevel / 5, 1);
      return {
        ...requiredSkill,
        currentLevel,
        gap: Math.max(5 - currentLevel, 0),
        completionContribution: normalizedLevel * requiredSkill.weight
      };
    });

    const completion = Math.round(
      weightedSkillScores.reduce((sum, skill) => sum + skill.completionContribution, 0) * 100
    );

    const missingSkills = weightedSkillScores
      .filter((skill) => skill.currentLevel < 4)
      .sort((a, b) => b.weight - a.weight || difficultyRank[b.difficulty] - difficultyRank[a.difficulty])
      .map((skill) => ({
        name: skill.name,
        difficulty: skill.difficulty,
        priorityScore: Number((skill.weight * (skill.gap / 5) * 100).toFixed(2))
      }));

    const roadmap = missingSkills.slice(0, 5).map((skill, index) => ({
      phase: index + 1,
      discipline: skill.name,
      milestone: `Advance ${skill.name} with project-driven drills and milestone reviews`,
      estimatedWeeks: skill.difficulty === "hard" ? 6 : skill.difficulty === "medium" ? 4 : 2
    }));

    return { targetRole, completion, missingSkills, weightedSkillScores, roadmap };
  }
}
