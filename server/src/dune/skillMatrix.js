import { CAREER_ROLES } from "../data/careerRoles.js";

/**
 * Compatibility view of the career catalogue in the original
 * `{ [roleName]: [{ name, weight, difficulty }] }` shape returned by
 * GET /api/v1/skills/matrix. The catalogue in src/data/careerRoles.js is the
 * source of truth; the two original roles keep their original weights.
 */
export const roleSkillMatrix = Object.freeze(
  Object.fromEntries(
    CAREER_ROLES.map((role) => [
      role.name,
      role.skills.map((skill) => ({ name: skill.name, weight: skill.weight, difficulty: skill.difficulty }))
    ])
  )
);
