import { UserRepository } from "../repositories/UserRepository.js";
import { AuthService } from "../services/authService.js";
import { OperativeStateService } from "../services/operativeStateService.js";
import { TokenService } from "../services/tokenService.js";
import { env } from "../config/env.js";
import { isGoogleOAuthConfigured } from "../config/passport.js";
import { ApiError } from "../utils/ApiError.js";
import {
  clearRefreshTokenCookie,
  getRefreshTokenFromRequest,
  setRefreshTokenCookie
} from "../utils/cookies.js";

const appendQuery = (baseUrl, params) => {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

const serializeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  provider: user.provider,
  role: user.role,
  avatarUrl: user.avatarUrl || "",
  bio: user.bio || "",
  totalSpice: user.totalSpice,
  currentRank: user.currentRank,
  targetRole: user.targetRole,
  focusStreak: user.focusStreak,
  stormModeActive: user.stormModeActive,
  skills: user.skills,
  organizationId: user.organizationId,
  teamRole: user.teamRole,
  onboarding: user.onboarding,
  preferences: user.preferences,
  team: user.team
    ? {
        id: user.team.id || user.team,
        name: user.team.name || null,
        totalSpice: user.team.totalSpice,
        totalStreak: user.team.totalStreak
      }
    : null
});

export class AuthController {
  constructor({
    authService = new AuthService(),
    userRepository = new UserRepository(),
    operativeStateService = new OperativeStateService(),
    tokenService = new TokenService(),
    isGoogleOAuthConfigured: googleOAuthConfigured = isGoogleOAuthConfigured
  } = {}) {
    Object.assign(this, { authService, userRepository, operativeStateService, tokenService });
    this.googleOAuthConfigured = googleOAuthConfigured;
  }

  async register(req, res) {
    const result = await this.authService.register(req.body, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip
    });
    setRefreshTokenCookie(res, result.refreshToken);

    res.status(201).json({
      success: true,
      data: {
        user: serializeUser(result.user),
        accessToken: result.accessToken
      }
    });
  }

  async login(req, res) {
    const result = await this.authService.login(req.body, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip
    });
    setRefreshTokenCookie(res, result.refreshToken);

    res.json({
      success: true,
      data: {
        user: serializeUser(result.user),
        accessToken: result.accessToken
      }
    });
  }

  async refresh(req, res) {
    const refreshToken = getRefreshTokenFromRequest(req);
    const tokens = await this.authService.refresh(refreshToken, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip
    });
    setRefreshTokenCookie(res, tokens.refreshToken);

    res.json({ success: true, data: { accessToken: tokens.accessToken } });
  }

  async logout(req, res) {
    await this.authService.logout(getRefreshTokenFromRequest(req));
    clearRefreshTokenCookie(res);
    res.json({ success: true, message: "Logged out successfully" });
  }

  async me(req, res) {
    const user = await this.userRepository.findById(req.user.id);
    const syncedUser = await this.operativeStateService.syncUserState(user);
    res.json({ success: true, data: serializeUser(syncedUser) });
  }

  async googleUrl(_req, res) {
    res.json({
      success: true,
      data: {
        enabled: this.googleOAuthConfigured(),
        url: this.googleOAuthConfigured()
          ? `${env.googleRedirectUri.replace(/\/callback$/, "")}`
          : null
      }
    });
  }

  async ensureGoogleConfigured(_req, _res, next) {
    if (!this.googleOAuthConfigured()) {
      return next(new ApiError(503, "Google OAuth is not configured"));
    }

    return next();
  }

  async googleCallback(req, res) {
    const tokens = await this.tokenService.issueTokens(req.user, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip
    });
    setRefreshTokenCookie(res, tokens.refreshToken);

    const redirectUrl = appendQuery(env.googleSuccessRedirectUrl, {
      provider: "google",
      auth: "success"
    });

    res.redirect(redirectUrl);
  }

  async googleFailure(_req, res) {
    res.redirect(env.googleFailureRedirectUrl);
  }
}
