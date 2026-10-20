import { RefreshToken } from "../models/RefreshToken.js";

export class RefreshTokenRepository {
  create(data) {
    return RefreshToken.create(data);
  }

  deleteByUserId(userId, options = {}) {
    return RefreshToken.deleteMany({ user: userId }, options);
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

  consumeValidToken(tokenHash) {
    return RefreshToken.findOneAndUpdate(
      { tokenHash, revokedAt: null, expiresAt: { $gt: new Date() } },
      { $set: { revokedAt: new Date() } },
      { new: true }
    ).populate("user");
  }
}
