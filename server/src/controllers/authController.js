import { UserRepository } from "../repositories/UserRepository.js";
import { AuthService } from "../services/authService.js";
import { GoogleOAuthService } from "../services/googleOAuthService.js";

const authService = new AuthService();
const googleOAuthService = new GoogleOAuthService();
const userRepository = new UserRepository();

const userResponse = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  totalSpice: user.totalSpice,
  currentRank: user.currentRank,
  targetRole: user.targetRole,
  focusStreak: user.focusStreak,
  stormModeActive: user.stormModeActive,
  skills: user.skills
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
        user: userResponse(result.user),
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
        user: userResponse(result.user),
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
    res.json({ success: true, data: userResponse(user) });
  }

  async googleUrl(_req, res) {
    const url = googleOAuthService.getAuthorizationUrl();
    res.json({
      success: true,
      data: {
        enabled: Boolean(url),
        url
      }
    });
  }

  async googleCallback(req, res) {
    const result = await googleOAuthService.exchangeCode(req.body.code || req.query.code, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip
    });

    res.json({
      success: true,
      data: {
        user: userResponse(result.user),
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    });
  }
}
