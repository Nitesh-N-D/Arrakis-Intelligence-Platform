// Pure helpers behind the career selector. Kept free of JSX so they run under `node --test`.
import {
  CAREER_CATEGORIES,
  CUSTOM_ROLE_ID,
  getRoleById,
  searchCareerRoles
} from "../../data/careerRoles.js";

export const ALL_CATEGORY = "all";
export const CUSTOM_LIMITS = Object.freeze({ titleMin: 2, titleMax: 80, descriptionMax: 280, skillsMax: 20, skillNameMax: 60 });

export const categoryTabs = () => [{ id: ALL_CATEGORY, name: "All" }, ...CAREER_CATEGORIES];

/** Ranked roles for the current query and category tab. */
export function filterRoles(query, categoryId = ALL_CATEGORY, limit = 60) {
  return searchCareerRoles(query, { categoryId: categoryId === ALL_CATEGORY ? null : categoryId, limit });
}

/**
 * Options rendered in the listbox: matching roles followed by a "custom role" entry,
 * so a user can always continue with a title that is not in the catalogue.
 */
export function buildOptions(query, categoryId = ALL_CATEGORY) {
  const roles = filterRoles(query, categoryId);
  const trimmed = String(query || "").trim();
  return [
    ...roles.map((role) => ({ type: "role", id: role.id, role })),
    { type: "custom", id: CUSTOM_ROLE_ID, title: trimmed }
  ];
}

/** Keyboard navigation for the combobox listbox. Returns the next active index, or null for "no change". */
export function nextActiveIndex(key, current, length) {
  if (length <= 0) return -1;
  switch (key) {
    case "ArrowDown": return current < 0 ? 0 : (current + 1) % length;
    case "ArrowUp": return current <= 0 ? length - 1 : current - 1;
    case "Home": return 0;
    case "End": return length - 1;
    case "PageDown": return Math.min(length - 1, Math.max(0, current) + 5);
    case "PageUp": return Math.max(0, current - 5);
    default: return null;
  }
}

export const emptySelection = () => ({
  roleId: null,
  customTitle: "",
  customCategory: "other",
  customDescription: "",
  customSkills: [],
  experienceLevel: null,
  targetLevel: null,
  timelineMonths: null
});

/** Builds selection state from a serialized server career (`user.career`). */
export function selectionFromCareer(career) {
  if (!career || (!career.roleId && !career.title)) return emptySelection();
  const base = {
    ...emptySelection(),
    experienceLevel: career.experienceLevel || null,
    targetLevel: career.targetLevel || null,
    timelineMonths: career.timelineMonths || null
  };
  if (!career.isCustom && career.roleId && getRoleById(career.roleId)) return { ...base, roleId: career.roleId };
  return {
    ...base,
    roleId: CUSTOM_ROLE_ID,
    customTitle: career.title || "",
    customCategory: career.category || "other",
    customDescription: career.description || "",
    customSkills: (career.customSkills || []).map((skill) => ({ name: skill.name, priority: skill.priority || "important" }))
  };
}

const unsafeText = /[\u0000-\u001f\u007f<>​-‏‪-‮⁦-⁩]/;

/** Client-side checks mirror the server's so users see problems early. The server still validates everything. */
export function validateSelection(selection) {
  const errors = {};
  if (!selection?.roleId) {
    errors.role = "Choose a career, or enter a custom role.";
    return errors;
  }
  if (selection.roleId !== CUSTOM_ROLE_ID) {
    if (!getRoleById(selection.roleId)) errors.role = "That career is no longer in the catalogue. Choose another.";
    return errors;
  }
  const title = String(selection.customTitle || "").replace(/\s+/g, " ").trim();
  if (title.length < CUSTOM_LIMITS.titleMin || title.length > CUSTOM_LIMITS.titleMax) {
    errors.customTitle = `Use ${CUSTOM_LIMITS.titleMin}–${CUSTOM_LIMITS.titleMax} characters.`;
  } else if (unsafeText.test(title)) {
    errors.customTitle = "Remove angle brackets and special control characters.";
  } else if (!/\p{L}/u.test(title)) {
    errors.customTitle = "Include at least one letter.";
  }
  if (String(selection.customDescription || "").length > CUSTOM_LIMITS.descriptionMax) {
    errors.customDescription = `Keep the description under ${CUSTOM_LIMITS.descriptionMax} characters.`;
  }
  if ((selection.customSkills || []).length > CUSTOM_LIMITS.skillsMax) {
    errors.customSkills = `Add no more than ${CUSTOM_LIMITS.skillsMax} skills.`;
  }
  return errors;
}

/** Payload sent to the server (`career`). The server re-resolves catalogue roles and ignores anything else. */
export function toCareerPayload(selection) {
  const preferences = {
    experienceLevel: selection.experienceLevel || null,
    targetLevel: selection.targetLevel || null,
    timelineMonths: selection.timelineMonths || null
  };
  if (selection.roleId && selection.roleId !== CUSTOM_ROLE_ID) return { roleId: selection.roleId, ...preferences };
  return {
    roleId: CUSTOM_ROLE_ID,
    customTitle: String(selection.customTitle || "").replace(/\s+/g, " ").trim(),
    customCategory: selection.customCategory || "other",
    customDescription: String(selection.customDescription || "").trim(),
    customSkills: (selection.customSkills || []).map((skill) => ({ name: skill.name, priority: skill.priority || "important" })),
    ...preferences
  };
}

/** Display title for the current selection. */
export function selectionTitle(selection) {
  if (!selection?.roleId) return "";
  if (selection.roleId === CUSTOM_ROLE_ID) return String(selection.customTitle || "").trim();
  return getRoleById(selection.roleId)?.name || "";
}

export function addCustomSkill(skills, name, priority = "important") {
  const clean = String(name || "").replace(/\s+/g, " ").trim().slice(0, CUSTOM_LIMITS.skillNameMax);
  if (!clean || unsafeText.test(clean)) return skills;
  if (skills.some((skill) => skill.name.toLowerCase() === clean.toLowerCase())) return skills;
  if (skills.length >= CUSTOM_LIMITS.skillsMax) return skills;
  return [...skills, { name: clean, priority }];
}
