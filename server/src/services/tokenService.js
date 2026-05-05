import { env } from "../config/env.js";
import { RefreshTokenRepository } from "../repositories/RefreshTokenRepository.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

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

    await refreshTokenRepository.create({
      user: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + parseDuration(env.jwtRefreshExpiresIn)),
      userAgent: meta.userAgent || "",
      ipAddress: meta.ipAddress || ""
    });

    return { accessToken, refreshToken };
  }

  async rotateRefreshToken(token, meta = {}) {
    verifyRefreshToken(token);
    const record = await refreshTokenRepository.findValidToken(token);

    if (!record || record.expiresAt < new Date()) {
      throw new Error("Refresh token is invalid");
    }

    await refreshTokenRepository.revokeToken(token);
    return this.issueTokens(record.user, meta);
  }

  revokeRefreshToken(token) {
    return refreshTokenRepository.revokeToken(token);
  }
}
