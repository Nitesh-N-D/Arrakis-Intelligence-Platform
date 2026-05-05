import { UserRepository } from "../repositories/UserRepository.js";
import { AuthService } from "../services/authService.js";
import { OperativeStateService } from "../services/operativeStateService.js";
import { TokenService } from "../services/tokenService.js";
import { env } from "../config/env.js";
import { isGoogleOAuthConfigured } from "../config/passport.js";
import { ApiError } from "../utils/ApiError.js";

const authService = new AuthService();
const userRepository = new UserRepository();
const operativeStateService = new OperativeStateService();
const tokenService = new TokenService();

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
  role: user.role,
  totalSpice: user.totalSpice,
  currentRank: user.currentRank,
  targetRole: user.targetRole,
  focusStreak: user.focusStreak,
  stormModeActive: user.stormModeActive,
  skills: user.skills,
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
  async register(req, res) {
    const result = await authService.register(req.body, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      data: {
        user: serializeUser(result.user),
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    });
  }

  async login(req, res) {
    const result = await authService.login(req.body, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: {
        user: serializeUser(result.user),
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    });
  }

  async refresh(req, res) {
    const tokens = await authService.refresh(req.body.refreshToken, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip
    });

    res.json({ success: true, data: tokens });
  }

  async logout(req, res) {
    await authService.logout(req.body.refreshToken);
    res.json({ success: true, message: "Logged out successfully" });
  }

  async me(req, res) {
    const user = await userRepository.findById(req.user.id);
    const syncedUser = await operativeStateService.syncUserState(user);
    res.json({ success: true, data: serializeUser(syncedUser) });
  }

  async googleUrl(_req, res) {
    res.json({
      success: true,
      data: {
        enabled: isGoogleOAuthConfigured(),
        url: isGoogleOAuthConfigured() ? `${env.googleRedirectUri.replace(/\/callback$/, "")}` : null
      }
    });
  }

  async ensureGoogleConfigured(_req, _res, next) {
    if (!isGoogleOAuthConfigured()) {
      return next(new ApiError(503, "Google OAuth is not configured"));
    }

    return next();
  }

  async googleCallback(req, res) {
    const tokens = await tokenService.issueTokens(req.user, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip
    });

    const redirectUrl = appendQuery(env.googleSuccessRedirectUrl, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      provider: "google"
    });

    res.redirect(redirectUrl);
  }

  async googleFailure(_req, res) {
    res.redirect(env.googleFailureRedirectUrl);
  }
}
