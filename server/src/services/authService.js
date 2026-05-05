import { UserRepository } from "../repositories/UserRepository.js";
import { ApiError } from "../utils/ApiError.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { TokenService } from "./tokenService.js";

const userRepository = new UserRepository();
const tokenService = new TokenService();

export class AuthService {
  async register(payload, meta) {
    const existingUser = await userRepository.findByEmail(payload.email);
    if (existingUser) {
      throw new ApiError(409, "A user with this email already exists");
    }

    const passwordHash = await hashPassword(payload.password);
    const user = await userRepository.create({
      name: payload.name,
      email: payload.email,
      passwordHash,
      skills: payload.skills || [],
      targetRole: payload.targetRole || "AI Systems Engineer"
    });

    const tokens = await tokenService.issueTokens(user, meta);
    return { user, ...tokens };
  }

  async login(payload, meta) {
    const user = await userRepository.findByEmail(payload.email);
    if (!user || !user.passwordHash) {
      throw new ApiError(401, "Invalid credentials");
    }

    const validPassword = await comparePassword(payload.password, user.passwordHash);
    if (!validPassword) {
      throw new ApiError(401, "Invalid credentials");
    }

    const tokens = await tokenService.issueTokens(user, meta);
    return { user, ...tokens };
  }

  refresh(refreshToken, meta) {
    return tokenService.rotateRefreshToken(refreshToken, meta);
  }

  async logout(refreshToken) {
    if (refreshToken) {
      await tokenService.revokeRefreshToken(refreshToken);
    }
  }
}
