import { UserRepository } from "../repositories/UserRepository.js";
import { DEFAULT_FOCUS_PRESETS, isValidFocusDuration, normalizeFocusPresets } from "./focusLimits.js";
import { ApiError } from "../utils/ApiError.js";
import { careerFromTargetRole, normalizeCareerInput, serializeCareer } from "./careerProfile.js";

const allowedThemes = ["dark", "system"];
const finiteOr = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const normalizeSkills = (skills) => {
  if (!Array.isArray(skills)) {
    return [];
  }

  return skills
    .map((skill) => ({
      name: String(skill?.name || "").trim().slice(0, 80),
      level: Number(skill?.level || 1)
    }))
    .filter((skill) => skill.name)
    .slice(0, 100)
    .map((skill) => ({
      name: skill.name,
      level: Math.max(1, Math.min(5, Number.isFinite(skill.level) ? skill.level : 1))
    }));
};

const normalizeBlockedSites = (blockedSites) => {
  const values = Array.isArray(blockedSites)
    ? blockedSites
    : String(blockedSites || "")
        .split(/[\n,]/)
        .map((entry) => entry.trim())
        .filter(Boolean);

  return [...new Set(values.map((entry) => entry.toLowerCase()))].slice(0, 100);
};

const validateAvatarUrl = (value) => {
  const avatarUrl = String(value || "").trim();
  if (!avatarUrl) {
    return "";
  }

  try {
    const parsed = new URL(avatarUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("invalid");
    }
    return parsed.toString();
  } catch (_error) {
    throw new ApiError(400, "Avatar URL must be a valid http or https URL");
  }
};

const serializeProfile = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatarUrl: user.avatarUrl || "",
  bio: user.bio || "",
  role: user.role,
  provider: user.provider,
  targetRole: user.targetRole,
  career: serializeCareer(user),
  careerHistory: (user.careerHistory || []).map((entry) => ({
    roleId: entry.roleId || null,
    title: entry.title,
    changedAt: entry.changedAt
  })),
  skills: user.skills,
  totalSpice: user.totalSpice,
  currentRank: user.currentRank,
  focusStreak: user.focusStreak,
  preferences: user.preferences,
  onboarding: user.onboarding,
  team: user.team
    ? {
        id: user.team.id || user.team,
        name: user.team.name || null,
        totalSpice: user.team.totalSpice,
        totalStreak: user.team.totalStreak
      }
    : null
});

const careerDetailsSignature = (career) => JSON.stringify({
  experienceLevel: career.experienceLevel || null,
  targetLevel: career.targetLevel || null,
  timelineMonths: career.timelineMonths || null,
  category: career.isCustom ? career.category || "other" : null,
  description: career.isCustom ? career.description || "" : "",
  customSkills: (career.customSkills || []).map((skill) => [skill.name, skill.priority || "important"])
});

const careerDetailsChanged = (current, next) => careerDetailsSignature(current) !== careerDetailsSignature(next);

const blockingPolicies = ["always", "focus-only", "off"];
const teamSharingModes = ["summary", "none"];
const retentionOptions = [0, 30, 90, 180, 365];
const POLICY_FIELDS = ["blockedSites", "strictBlockMode", "extensionOverrideMinutes", "blockingPolicy", "trackingPaused"];
const boolOr = (value, fallback) => (typeof value === "boolean" ? value : fallback);
const clampOr = (value, min, max, fallback) => Math.max(min, Math.min(max, finiteOr(value, fallback)));

/** Merges a settings payload into stored preferences, validating every field and bumping policyVersion on policy changes. */
export function buildPreferences(currentPreferences = {}, payload = {}, now = new Date()) {
  const next = {
    ...currentPreferences,
    focusDurationPreference: isValidFocusDuration(Number(payload.focusDurationPreference))
      ? Number(payload.focusDurationPreference)
      : currentPreferences.focusDurationPreference,
    focusPresets:
      payload.focusPresets !== undefined
        ? normalizeFocusPresets(payload.focusPresets, currentPreferences.focusPresets || DEFAULT_FOCUS_PRESETS)
        : currentPreferences.focusPresets || [...DEFAULT_FOCUS_PRESETS],
    stormWarningMinutes: clampOr(payload.stormWarningMinutes, 15, 240, currentPreferences.stormWarningMinutes),
    blockedSites: normalizeBlockedSites(payload.blockedSites ?? currentPreferences.blockedSites),
    strictBlockMode: boolOr(payload.strictBlockMode, currentPreferences.strictBlockMode),
    extensionOverrideMinutes: clampOr(payload.extensionOverrideMinutes, 1, 60, currentPreferences.extensionOverrideMinutes),
    theme:
      typeof payload.theme === "string" && allowedThemes.includes(payload.theme)
        ? payload.theme
        : currentPreferences.theme,
    desktopNotificationsEnabled: boolOr(payload.desktopNotificationsEnabled, currentPreferences.desktopNotificationsEnabled),
    stormAlarmEnabled: boolOr(payload.stormAlarmEnabled, currentPreferences.stormAlarmEnabled),
    weeklyDigestEnabled: boolOr(payload.weeklyDigestEnabled, currentPreferences.weeklyDigestEnabled)
  };

  const optional = {
    breakMinutes: payload.breakMinutes !== undefined ? clampOr(payload.breakMinutes, 1, 60, currentPreferences.breakMinutes ?? 5) : currentPreferences.breakMinutes,
    longBreakMinutes: payload.longBreakMinutes !== undefined ? clampOr(payload.longBreakMinutes, 1, 120, currentPreferences.longBreakMinutes ?? 15) : currentPreferences.longBreakMinutes,
    blockingPolicy: blockingPolicies.includes(payload.blockingPolicy) ? payload.blockingPolicy : currentPreferences.blockingPolicy,
    trackingPaused: boolOr(payload.trackingPaused, currentPreferences.trackingPaused),
    teamSharing: teamSharingModes.includes(payload.teamSharing) ? payload.teamSharing : currentPreferences.teamSharing,
    dataRetentionDays: retentionOptions.includes(Number(payload.dataRetentionDays)) && payload.dataRetentionDays !== null && payload.dataRetentionDays !== ""
      ? Number(payload.dataRetentionDays)
      : currentPreferences.dataRetentionDays,
    dailyBriefingEnabled: boolOr(payload.dailyBriefingEnabled, currentPreferences.dailyBriefingEnabled)
  };
  for (const [key, value] of Object.entries(optional)) {
    if (value !== undefined) next[key] = value;
  }

  const policyChanged = POLICY_FIELDS.some((field) => JSON.stringify(next[field] ?? null) !== JSON.stringify(currentPreferences[field] ?? null));
  if (policyChanged) {
    next.policyVersion = (Number(currentPreferences.policyVersion) || 0) + 1;
    next.policyUpdatedAt = now;
  }
  return next;
}

export function serializeExtensionPolicy(user, focusActive = false) {
  const preferences = user.preferences?.toObject?.() || user.preferences || {};
  const blockingPolicy = blockingPolicies.includes(preferences.blockingPolicy) ? preferences.blockingPolicy : "always";
  return {
    accountId: String(user.id || user._id || ""),
    version: Number(preferences.policyVersion) || 0,
    updatedAt: preferences.policyUpdatedAt ? new Date(preferences.policyUpdatedAt).toISOString() : null,
    blockedSites: preferences.blockedSites || [],
    strictMode: Boolean(preferences.strictBlockMode),
    overrideMinutes: preferences.extensionOverrideMinutes || 5,
    blockingPolicy,
    trackingPaused: Boolean(preferences.trackingPaused),
    focusActive: Boolean(focusActive),
    // Convenience for the extension: whether listed sites should be blocked right now.
    blockingActive: blockingPolicy === "always" || (blockingPolicy === "focus-only" && Boolean(focusActive))
  };
}

export class ProfileService {
  constructor({ userRepository = new UserRepository(), careerService = null } = {}) {
    this.userRepository = userRepository;
    this.careerService = careerService;
  }

  async getCareerService() {
    if (!this.careerService) {
      const { CareerService } = await import("./careerService.js");
      this.careerService = new CareerService({ userRepository: this.userRepository });
    }
    return this.careerService;
  }

  async getProfile(userId) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return serializeProfile(user);
  }

  async updateProfile(userId, payload = {}) {
    const nextName = String(payload.name || "").trim();
    const nextBio = String(payload.bio || "").trim();
    const nextAvatarUrl = validateAvatarUrl(payload.avatarUrl);

    if (nextName.length < 2) {
      throw new ApiError(400, "Name must be at least 2 characters long");
    }

    if (nextBio.length > 280) {
      throw new ApiError(400, "Bio must be 280 characters or fewer");
    }

    // Career changes go through the career service so roadmap progress is preserved
    // and changes to a roadmap with progress require explicit confirmation.
    let nextCareer = null;
    if (payload.career !== undefined) {
      nextCareer = normalizeCareerInput(payload.career);
    } else if (payload.targetRole !== undefined) {
      const nextTargetRole = String(payload.targetRole || "").trim();
      if (nextTargetRole.length < 2) {
        throw new ApiError(400, "Target role is required");
      }
      nextCareer = careerFromTargetRole(nextTargetRole);
    }

    let careerService = null;
    if (nextCareer) {
      const current = await this.userRepository.findById(userId);
      if (!current) throw new ApiError(404, "User not found");
      careerService = await this.getCareerService();
      if (careerService.isSameRole(current, nextCareer)) {
        // Same role: only re-plan when structured details (level, timeline, custom skills) changed.
        if (payload.career === undefined || !careerDetailsChanged(serializeCareer(current), nextCareer)) nextCareer = null;
      } else {
        await careerService.assertChangeAllowed(current, nextCareer, payload.confirmRoadmapChange);
      }
    }

    const user = await this.userRepository.updateById(userId, {
      name: nextName,
      bio: nextBio,
      avatarUrl: nextAvatarUrl,
      ...(payload.skills !== undefined ? { skills: normalizeSkills(payload.skills) } : {})
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (nextCareer) {
      await careerService.update(user, { career: nextCareer, confirmRoadmapChange: payload.confirmRoadmapChange });
      return serializeProfile(await this.userRepository.findById(userId));
    }

    return serializeProfile(user);
  }

  async updateSettings(userId, payload = {}) {
    const current = await this.userRepository.findById(userId);
    if (!current) {
      throw new ApiError(404, "User not found");
    }

    const currentPreferences = current.preferences?.toObject?.() || current.preferences || {};
    const nextPreferences = buildPreferences(currentPreferences, payload);
    const user = await this.userRepository.updateById(userId, { preferences: nextPreferences });
    return serializeProfile(user);
  }

  /** Versioned blocking/tracking policy consumed by the Edge extension. Never includes tokens or history. */
  async getExtensionPolicy(userId, { focusSessionRepository = null } = {}) {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new ApiError(404, "User not found");
    let focusActive = false;
    if (focusSessionRepository) {
      const active = await focusSessionRepository.findActiveByUser(userId);
      focusActive = active?.status === "running";
    }
    return serializeExtensionPolicy(user, focusActive);
  }

  /**
   * Optimistic-concurrency write from the extension. `baseVersion` must match the stored version,
   * otherwise 409 is returned with the current policy so the extension can adopt the server copy.
   */
  async updateExtensionPolicy(userId, payload = {}) {
    const current = await this.userRepository.findById(userId);
    if (!current) throw new ApiError(404, "User not found");
    const currentPreferences = current.preferences?.toObject?.() || current.preferences || {};
    const baseVersion = Number(payload.baseVersion);
    if (!Number.isInteger(baseVersion) || baseVersion < 0) {
      throw new ApiError(400, "baseVersion is required");
    }
    if (baseVersion !== (currentPreferences.policyVersion || 0)) {
      const error = new ApiError(409, "Settings were changed elsewhere. The latest server settings were kept.");
      error.details = { policy: serializeExtensionPolicy(current, false) };
      throw error;
    }
    const nextPreferences = buildPreferences(currentPreferences, {
      blockedSites: payload.blockedSites,
      strictBlockMode: payload.strictMode,
      extensionOverrideMinutes: payload.overrideMinutes,
      blockingPolicy: payload.blockingPolicy,
      trackingPaused: payload.trackingPaused
    });
    const user = await this.userRepository.updateById(userId, { preferences: nextPreferences });
    return serializeExtensionPolicy(user, false);
  }
}
