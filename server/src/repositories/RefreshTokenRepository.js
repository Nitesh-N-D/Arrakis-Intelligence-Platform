import { RefreshToken } from "../models/RefreshToken.js";

export class RefreshTokenRepository {
  create(data) {
    return RefreshToken.create(data);
  }

  findValidToken(tokenHash) {
    return RefreshToken.findOne({ tokenHash, revokedAt: null }).populate("user");
  }

  revokeToken(tokenHash) {
    return RefreshToken.findOneAndUpdate(
      { tokenHash },
      { revokedAt: new Date() },
      { new: true }
    );
  }
}
