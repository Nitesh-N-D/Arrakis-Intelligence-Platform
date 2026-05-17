import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";
import { RefreshTokenRepository } from "../repositories/RefreshTokenRepository.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { hashOpaqueToken } from "../utils/tokens.js";

const refreshTokenRepository = new RefreshTokenRepository();

const parseDuration = (value) => {
  const amount = Number.parseInt(value, 10);

  if (value.endsWith("d")) return amount * 24 * 60 * 60 * 1000;
  if (value.endsWith("h")) return amount * 60 * 60 * 1000;
  if (value.endsWith("m")) return amount * 60 * 1000;
  return amount * 1000;
};

export class TokenService {
  async issueTokens(user, meta = {}) {
    const accessToken = signAccessToken({ sub: user.id, role: user.role });
    const refreshToken = signRefreshToken({ sub: user.id });
    const tokenHash = hashOpaqueToken(refreshToken);

    await refreshTokenRepository.create({
      user: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + parseDuration(env.jwtRefreshExpiresIn)),
      userAgent: meta.userAgent || "",
      ipAddress: meta.ipAddress || ""
    });

    return { accessToken, refreshToken };
  }

  async rotateRefreshToken(token, meta = {}) {
    try {
      verifyRefreshToken(token);
    } catch (_error) {
      throw new ApiError(401, "Refresh token is invalid or expired");
    }

    const tokenHash = hashOpaqueToken(token);
    const record = await refreshTokenRepository.findValidToken(tokenHash);

    if (!record) {
      throw new ApiError(401, "Refresh token is invalid or expired");
    }

    if (record.expiresAt < new Date()) {
      await refreshTokenRepository.revokeToken(tokenHash);
      throw new ApiError(401, "Refresh token is invalid or expired");
    }

    await refreshTokenRepository.revokeToken(tokenHash);
    return this.issueTokens(record.user, meta);
  }

  revokeRefreshToken(token) {
    return refreshTokenRepository.revokeToken(hashOpaqueToken(token));
  }
}
