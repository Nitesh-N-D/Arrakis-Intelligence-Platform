import { UserRepository } from "../repositories/UserRepository.js";
import { ApiError } from "../utils/ApiError.js";

const userRepository = new UserRepository();

const allowedThemes = ["dark", "system"];

const normalizeSkills = (skills) => {
  if (!Array.isArray(skills)) {
    return [];
  }

  return skills
    .map((skill) => ({
      name: String(skill?.name || "").trim(),
      level: Number(skill?.level || 1)
    }))
    .filter((skill) => skill.name)
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
  skills: user.skills,
  totalSpice: user.totalSpice,
  currentRank: user.currentRank,
  focusStreak: user.focusStreak,
  preferences: user.preferences,
  billing: user.billing,
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

export class ProfileService {
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return serializeProfile(user);
  }

  async updateProfile(userId, payload = {}) {
    const nextName = String(payload.name || "").trim();
    const nextBio = String(payload.bio || "").trim();
    const nextTargetRole = String(payload.targetRole || "").trim();
    const nextAvatarUrl = validateAvatarUrl(payload.avatarUrl);

    if (nextName.length < 2) {
      throw new ApiError(400, "Name must be at least 2 characters long");
    }

    if (nextBio.length > 280) {
      throw new ApiError(400, "Bio must be 280 characters or fewer");
    }

    if (nextTargetRole.length < 2) {
      throw new ApiError(400, "Target role is required");
    }

    const user = await userRepository.updateById(userId, {
      name: nextName,
      bio: nextBio,
      avatarUrl: nextAvatarUrl,
      targetRole: nextTargetRole,
      skills: normalizeSkills(payload.skills)
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return serializeProfile(user);
  }

  async updateSettings(userId, payload = {}) {
    const current = await userRepository.findById(userId);
    if (!current) {
      throw new ApiError(404, "User not found");
    }

    const nextPreferences = {
      ...current.preferences,
      focusDurationPreference: [25, 50].includes(Number(payload.focusDurationPreference))
        ? Number(payload.focusDurationPreference)
        : current.preferences.focusDurationPreference,
      stormWarningMinutes: Math.max(
        15,
        Math.min(240, Number(payload.stormWarningMinutes || current.preferences.stormWarningMinutes))
      ),
      blockedSites: normalizeBlockedSites(payload.blockedSites ?? current.preferences.blockedSites),
      strictBlockMode:
        typeof payload.strictBlockMode === "boolean"
          ? payload.strictBlockMode
          : current.preferences.strictBlockMode,
      extensionOverrideMinutes: Math.max(
        1,
        Math.min(
          60,
          Number(payload.extensionOverrideMinutes || current.preferences.extensionOverrideMinutes)
        )
      ),
      theme:
        typeof payload.theme === "string" && allowedThemes.includes(payload.theme)
          ? payload.theme
          : current.preferences.theme,
      desktopNotificationsEnabled:
        typeof payload.desktopNotificationsEnabled === "boolean"
          ? payload.desktopNotificationsEnabled
          : current.preferences.desktopNotificationsEnabled,
      stormAlarmEnabled:
        typeof payload.stormAlarmEnabled === "boolean"
          ? payload.stormAlarmEnabled
          : current.preferences.stormAlarmEnabled,
      weeklyDigestEnabled:
        typeof payload.weeklyDigestEnabled === "boolean"
          ? payload.weeklyDigestEnabled
          : current.preferences.weeklyDigestEnabled
    };

    const user = await userRepository.updateById(userId, { preferences: nextPreferences });
    return serializeProfile(user);
  }
}
