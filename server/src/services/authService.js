import { UserRepository } from "../repositories/UserRepository.js";
import { ApiError } from "../utils/ApiError.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { TokenService } from "./tokenService.js";
import { roleSkillMatrix } from "../dune/skillMatrix.js";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

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

const validatePassword = (password) => {
  if (String(password || "").length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }
  if (Buffer.byteLength(String(password), "utf8") > 72) {
    throw new ApiError(400, "Password must be 72 UTF-8 bytes or fewer");
  }
};

export class AuthService {
  constructor({ userRepository = new UserRepository(), tokenService = new TokenService() } = {}) {
    this.userRepository = userRepository;
    this.tokenService = tokenService;
  }

  async register(payload, meta = {}) {
    const name = String(payload?.name || "").trim();
    const email = normalizeEmail(payload?.email);
    const password = String(payload?.password || "");

    if (name.length < 2 || name.length > 100) {
      throw new ApiError(400, "Name must be between 2 and 100 characters long");
    }

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      throw new ApiError(400, "A valid email address is required");
    }

    validatePassword(password);
    const targetRole = String(payload.targetRole || "AI Systems Engineer").trim();
    if (!Object.hasOwn(roleSkillMatrix, targetRole)) {
      throw new ApiError(400, "Choose a supported target role.");
    }

    const existingUser = await this.userRepository.findByEmail(email);
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
    const user = await this.userRepository.create({
      name,
      email,
      provider: "local",
      passwordHash,
      targetRole,
      skills: normalizeSkills(payload.skills)
    });

    const tokens = await this.tokenService.issueTokens(user, meta);
    return { user, ...tokens };
  }

  async login(payload, meta = {}) {
    const email = normalizeEmail(payload?.email);
    const password = String(payload?.password || "");

    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user || !user.passwordHash) {
      throw new ApiError(401, "Invalid credentials");
    }

    const passwordValid = await comparePassword(password, user.passwordHash);
    if (!passwordValid) {
      throw new ApiError(401, "Invalid credentials");
    }

    const tokens = await this.tokenService.issueTokens(user, meta);
    return { user, ...tokens };
  }

  refresh(refreshToken, meta = {}) {
    if (!refreshToken) {
      throw new ApiError(401, "Refresh token is required");
    }
    return this.tokenService.rotateRefreshToken(refreshToken, meta);
  }

  async logout(refreshToken) {
    if (refreshToken) {
      await this.tokenService.revokeRefreshToken(refreshToken);
    }
  }
}
