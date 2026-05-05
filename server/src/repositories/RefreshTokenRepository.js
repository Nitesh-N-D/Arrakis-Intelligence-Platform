import { RefreshToken } from "../models/RefreshToken.js";

export class RefreshTokenRepository {
  create(data) {
    return RefreshToken.create(data);
  }

  findValidToken(token) {
    return RefreshToken.findOne({ token, revokedAt: null }).populate("user");
  }

  revokeToken(token) {
    return RefreshToken.findOneAndUpdate({ token }, { revokedAt: new Date() }, { new: true });
  }
}
