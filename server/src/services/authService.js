import { UserRepository } from "../repositories/UserRepository.js";
import { ApiError } from "../utils/ApiError.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { TokenService } from "./tokenService.js";

const userRepository = new UserRepository();
const tokenService = new TokenService();

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

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

const validatePassword = (password) => {
  if (String(password || "").length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }
};

export class AuthService {
  async register(payload, meta = {}) {
    const name = String(payload?.name || "").trim();
    const email = normalizeEmail(payload?.email);
    const password = String(payload?.password || "");

    if (name.length < 2) {
      throw new ApiError(400, "Name must be at least 2 characters long");
    }

    if (!email || !email.includes("@")) {
      throw new ApiError(400, "A valid email address is required");
    }

    validatePassword(password);

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      if (existingUser.provider === "google" && !existingUser.passwordHash) {
        throw new ApiError(
          409,
          "An account with this email already exists through Google sign-in"
        );
      }
      throw new ApiError(409, "A user with this email already exists");
    }

    const passwordHash = await hashPassword(password);
    const user = await userRepository.create({
      name,
      email,
      provider: "local",
      passwordHash,
      targetRole: payload.targetRole || "AI Systems Engineer",
      skills: normalizeSkills(payload.skills)
    });

    const tokens = await tokenService.issueTokens(user, meta);
    return { user, ...tokens };
  }

  async login(payload, meta = {}) {
    const email = normalizeEmail(payload?.email);
    const password = String(payload?.password || "");

    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const user = await userRepository.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw new ApiError(401, "Invalid credentials");
    }

    const passwordValid = await comparePassword(password, user.passwordHash);
    if (!passwordValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    const tokens = await tokenService.issueTokens(user, meta);
    return { user, ...tokens };
  }

  refresh(refreshToken, meta = {}) {
    if (!refreshToken) {
      throw new ApiError(401, "Refresh token is required");
    }
    return tokenService.rotateRefreshToken(refreshToken, meta);
  }

  async logout(refreshToken) {
    if (refreshToken) {
      await tokenService.revokeRefreshToken(refreshToken);
    }
  }
}
