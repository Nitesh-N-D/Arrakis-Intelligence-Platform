import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";
import { RefreshTokenRepository } from "../repositories/RefreshTokenRepository.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { hashOpaqueToken } from "../utils/tokens.js";

const parseDuration = (value) => {
  const amount = Number.parseInt(value, 10);

  if (value.endsWith("d")) return amount * 24 * 60 * 60 * 1000;
  if (value.endsWith("h")) return amount * 60 * 60 * 1000;
  if (value.endsWith("m")) return amount * 60 * 1000;
  return amount * 1000;
};

export class TokenService {
  constructor({ refreshTokenRepository = new RefreshTokenRepository() } = {}) {
    this.refreshTokenRepository = refreshTokenRepository;
  }

  async issueTokens(user, meta = {}, authenticatedAt = new Date()) {
    const authTime = authenticatedAt instanceof Date ? authenticatedAt : new Date(authenticatedAt);
    const accessToken = signAccessToken({
      sub: user.id,
      role: user.role,
      authTime: Math.floor(authTime.getTime() / 1000)
    });
    const refreshToken = signRefreshToken({ sub: user.id, authTime: Math.floor(authTime.getTime() / 1000) });
    const tokenHash = hashOpaqueToken(refreshToken);

    await this.refreshTokenRepository.create({
      user: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + parseDuration(env.jwtRefreshExpiresIn)),
      authTime,
      userAgent: meta.userAgent || "",
      ipAddress: meta.ipAddress || ""
    });

    return { accessToken, refreshToken };
  }

  async rotateRefreshToken(token, meta = {}) {
    let refreshPayload;
    try {
      refreshPayload = verifyRefreshToken(token);
    } catch (_error) {
      throw new ApiError(401, "Refresh token is invalid or expired");
    }

    const tokenHash = hashOpaqueToken(token);
    const record = await this.refreshTokenRepository.consumeValidToken(tokenHash);

    if (!record) {
      throw new ApiError(401, "Refresh token is invalid or expired");
    }

    const originalAuthTime = record.authTime || (refreshPayload.authTime
      ? new Date(refreshPayload.authTime * 1000)
      : record.createdAt || new Date());
    return this.issueTokens(record.user, meta, originalAuthTime);
  }

  revokeRefreshToken(token) {
    return this.refreshTokenRepository.revokeToken(hashOpaqueToken(token));
  }
}
