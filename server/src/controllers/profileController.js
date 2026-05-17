import { ProfileService } from "../services/profileService.js";

const profileService = new ProfileService();

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
}
