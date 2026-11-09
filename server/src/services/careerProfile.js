import {
  CAREER_CATEGORIES,
  CAREER_CATALOGUE_VERSION,
  CUSTOM_ROLE_ID,
  DEFAULT_MIN_LEVEL,
  EXPERIENCE_LEVELS,
  PRIORITY_WEIGHTS,
  TIMELINE_OPTIONS,
  findRoleByName,
  findSkillByName,
  getRoleById,
  normalizeLookup
} from "../data/careerRoles.js";
import { ApiError } from "../utils/ApiError.js";

export const CAREER_LIMITS = Object.freeze({
  titleMin: 2,
  titleMax: 80,
  descriptionMax: 280,
  customSkillsMax: 20,
  skillNameMax: 60
});

const experienceIds = new Set(EXPERIENCE_LEVELS.map((level) => level.id));
const categoryIds = new Set(CAREER_CATEGORIES.map((category) => category.id));
const timelineMonths = new Set(TIMELINE_OPTIONS.map((option) => option.months));
const priorities = new Set(Object.keys(PRIORITY_WEIGHTS));
// Control characters, angle brackets and zero-width/bidi overrides are never valid in a title.
const disallowedTextPattern = /[\u0000-\u001f\u007f<>​-‏‪-‮⁦-⁩]/;

export function cleanText(value, { max, field, required = false, min = 0 }) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new ApiError(400, `${field} is required.`);
    return "";
  }
  if (typeof value !== "string") throw new ApiError(400, `${field} must be text.`);
  const normalized = value.normalize("NFKC").replace(/\s+/g, " ").trim();
  if (required && !normalized) throw new ApiError(400, `${field} is required.`);
  if (disallowedTextPattern.test(normalized)) {
    throw new ApiError(400, `${field} contains characters that are not allowed.`);
  }
  if (normalized.length < min || normalized.length > max) {
    throw new ApiError(400, `${field} must be between ${min} and ${max} characters.`);
  }
  return normalized;
}

function optionalEnum(value, allowed, field) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !allowed.has(value)) throw new ApiError(400, `Choose a valid ${field}.`);
  return value;
}

export function normalizeCustomSkills(skills) {
  if (skills === undefined || skills === null) return [];
  if (!Array.isArray(skills) || skills.length > CAREER_LIMITS.customSkillsMax) {
    throw new ApiError(400, `Add no more than ${CAREER_LIMITS.customSkillsMax} skills for a custom role.`);
  }
  const seen = new Set();
  const result = [];
  for (const entry of skills) {
    const raw = typeof entry === "string" ? entry : entry?.name;
    const name = cleanText(raw, { max: CAREER_LIMITS.skillNameMax, min: 1, field: "Skill name", required: true });
    const librarySkill = findSkillByName(name);
    const canonical = librarySkill?.name || name;
    const key = normalizeLookup(canonical);
    if (seen.has(key)) continue;
    seen.add(key);
    const priority = entry && typeof entry === "object" && entry.priority !== undefined
      ? optionalEnum(entry.priority, priorities, "skill priority")
      : "important";
    result.push({ name: canonical, priority: priority || "important" });
  }
  return result;
}

/**
 * Validates a career payload from the browser. The browser is never trusted:
 * catalogue roles are re-resolved by ID on the server and only server data is stored.
 */
export function normalizeCareerInput(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ApiError(400, "Career selection is required.");
  }
  const preferences = {
    experienceLevel: optionalEnum(payload.experienceLevel, experienceIds, "experience level"),
    targetLevel: optionalEnum(payload.targetLevel, experienceIds, "target level"),
    timelineMonths: null
  };
  if (payload.timelineMonths !== undefined && payload.timelineMonths !== null && payload.timelineMonths !== "") {
    const months = Number(payload.timelineMonths);
    if (!timelineMonths.has(months)) throw new ApiError(400, "Choose a valid target timeline.");
    preferences.timelineMonths = months;
  }

  const roleId = typeof payload.roleId === "string" ? payload.roleId.trim() : "";
  if (roleId && roleId !== CUSTOM_ROLE_ID) {
    const role = getRoleById(roleId);
    if (!role) throw new ApiError(400, "Choose a career from the catalogue or enter a custom role.");
    return {
      roleId: role.id,
      title: role.name,
      category: role.category,
      description: "",
      isCustom: false,
      customSkills: [],
      ...preferences,
      catalogueVersion: CAREER_CATALOGUE_VERSION
    };
  }

  const title = cleanText(payload.customTitle ?? payload.title, {
    field: "Custom role title",
    required: true,
    min: CAREER_LIMITS.titleMin,
    max: CAREER_LIMITS.titleMax
  });
  if (!/\p{L}/u.test(title)) throw new ApiError(400, "Custom role title must contain letters.");
  const category = payload.customCategory ?? payload.category;
  return {
    roleId: CUSTOM_ROLE_ID,
    title,
    category: optionalEnum(category, categoryIds, "category") || "other",
    description: cleanText(payload.customDescription ?? payload.description, {
      field: "Custom role description",
      max: CAREER_LIMITS.descriptionMax
    }),
    isCustom: true,
    customSkills: normalizeCustomSkills(payload.customSkills ?? payload.skills),
    ...preferences,
    catalogueVersion: CAREER_CATALOGUE_VERSION
  };
}

/**
 * Accepts the legacy `targetRole` string used by the original registration and
 * profile APIs. Catalogue names/aliases resolve to their role; anything else
 * becomes a validated custom title.
 */
export function careerFromTargetRole(targetRole) {
  const value = typeof targetRole === "string" ? targetRole : "";
  const role = findRoleByName(value);
  if (role) return normalizeCareerInput({ roleId: role.id });
  return normalizeCareerInput({ roleId: CUSTOM_ROLE_ID, customTitle: value });
}

function levelFor(id) {
  return EXPERIENCE_LEVELS.find((level) => level.id === id)?.level ?? null;
}

/**
 * Builds the requirement list used by the analyzer for any user.
 * Users without a stored career (all accounts created before this release)
 * are resolved from their `targetRole` string, so nothing breaks for them.
 */
export function resolveCareerProfile({ targetRole, career, allowCustom = false }) {
  let stored = career && (career.roleId || career.title) ? career : null;
  let role = null;
  if (stored && !stored.isCustom) {
    role = getRoleById(stored.roleId) || findRoleByName(stored.title);
  }
  if (!stored) {
    if (typeof targetRole !== "string" || !targetRole.trim()) {
      throw new ApiError(400, "Choose a supported target role.");
    }
    role = findRoleByName(targetRole) || getRoleById(targetRole);
    if (role) stored = { roleId: role.id, title: role.name, category: role.category, isCustom: false };
    else if (allowCustom) {
      stored = { roleId: CUSTOM_ROLE_ID, title: targetRole.trim().slice(0, CAREER_LIMITS.titleMax), category: "other", isCustom: true, customSkills: [] };
    } else {
      throw new ApiError(400, "Choose a supported target role.");
    }
  }

  const targetLevel = levelFor(stored.targetLevel);
  const levelOffset = targetLevel ? targetLevel - 4 : 0;
  const expected = (minLevel) => Math.min(5, Math.max(2, minLevel + levelOffset));
  let requirements;
  if (role) {
    requirements = role.skills.map((skill) => ({
      name: skill.name,
      priority: skill.priority,
      minLevel: skill.minLevel,
      expectedLevel: expected(skill.minLevel),
      difficulty: skill.difficulty,
      weight: skill.weight,
      why: skill.why,
      skillId: skill.id
    }));
  } else {
    const custom = Array.isArray(stored.customSkills) ? stored.customSkills : [];
    const total = custom.reduce((sum, skill) => sum + (PRIORITY_WEIGHTS[skill.priority] || 2), 0) || 1;
    requirements = custom.map((skill) => {
      const priority = PRIORITY_WEIGHTS[skill.priority] ? skill.priority : "important";
      const library = findSkillByName(skill.name);
      const minLevel = DEFAULT_MIN_LEVEL[priority];
      return {
        name: library?.name || skill.name,
        priority,
        minLevel,
        expectedLevel: expected(minLevel),
        difficulty: library?.difficulty || "medium",
        weight: Number((PRIORITY_WEIGHTS[priority] / total).toFixed(4)),
        why: library?.why || "Chosen by you as relevant to this role.",
        skillId: library?.id || null
      };
    });
  }

  return {
    roleId: role ? role.id : CUSTOM_ROLE_ID,
    title: role ? role.name : stored.title,
    category: role ? role.category : stored.category || "other",
    description: role ? role.description : stored.description || "",
    isCustom: !role,
    experienceLevel: stored.experienceLevel || null,
    targetLevel: stored.targetLevel || null,
    timelineMonths: stored.timelineMonths || null,
    requirements
  };
}

/** Public shape of a user's career. Legacy accounts get a resolved view from `targetRole`. */
export function serializeCareer(user) {
  const stored = user?.career?.toObject?.() || user?.career || null;
  const pending = Boolean(stored?.selectionPending);
  const hasStored = Boolean(stored && stored.title && stored.title === user.targetRole);
  const base = hasStored ? stored : (() => {
    const role = findRoleByName(user?.targetRole);
    return role
      ? { roleId: role.id, title: role.name, category: role.category, isCustom: false }
      : { roleId: CUSTOM_ROLE_ID, title: user?.targetRole || "", category: "other", isCustom: true };
  })();
  return {
    roleId: base.roleId || null,
    title: base.title || "",
    category: base.category || "other",
    description: base.description || "",
    isCustom: Boolean(base.isCustom),
    customSkills: (base.customSkills || []).map((skill) => ({ name: skill.name, priority: skill.priority })),
    experienceLevel: base.experienceLevel || null,
    targetLevel: base.targetLevel || null,
    timelineMonths: base.timelineMonths || null,
    selectionPending: pending,
    selectedAt: stored?.selectedAt || null
  };
}

/** The stored career, only when it agrees with `targetRole` (legacy data may disagree). */
export function careerForAnalysis(user) {
  const stored = user?.career?.toObject?.() || user?.career || null;
  return stored && stored.title && stored.title === user.targetRole ? stored : null;
}
