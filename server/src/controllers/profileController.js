import { ProfileService } from "../services/profileService.js";
import { AccountDataService } from "../services/accountDataService.js";
import { clearRefreshTokenCookie } from "../utils/cookies.js";
import { getIo } from "../socket/index.js";

const profileService = new ProfileService();
const accountDataService = new AccountDataService();

export class ProfileController {
  async show(req, res) {
    const profile = await profileService.getProfile(req.user.id);
    res.json({ success: true, data: profile });
  }

  async update(req, res) {
    const profile = await profileService.updateProfile(req.user.id, req.body);
    res.json({ success: true, data: profile, message: "Profile updated successfully" });
  }

  async updateSettings(req, res) {
    const profile = await profileService.updateSettings(req.user.id, req.body);
    res.json({ success: true, data: profile, message: "Settings updated successfully" });
  }

  async exportAccount(req, res) {
    const data = await accountDataService.exportAccount(req.user.id);
    res.setHeader("Content-Disposition", 'attachment; filename="arrakis-account-data.json"');
    res.json({ success: true, data });
  }

  async deleteAccount(req, res) {
    await accountDataService.deleteAccount(req.user.id, {
      ...req.body,
      authTime: req.authTime
    });
    clearRefreshTokenCookie(res);
    getIo()?.in(`user:${req.user.id}`).disconnectSockets(true);
    res.json({ success: true, message: "Account and associated personal data were deleted." });
  }
}
