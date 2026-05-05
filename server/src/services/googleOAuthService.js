import axios from "axios";
import { env } from "../config/env.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { TokenService } from "./tokenService.js";

const userRepository = new UserRepository();
const tokenService = new TokenService();

export class GoogleOAuthService {
  getAuthorizationUrl() {
    if (!env.googleClientId) {
      return null;
    }

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", env.googleClientId);
    url.searchParams.set("redirect_uri", env.googleRedirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    return url.toString();
  }

  async exchangeCode(code, meta = {}) {
    const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      redirect_uri: env.googleRedirectUri,
      grant_type: "authorization_code"
    });

    const profileResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
    });

    const profile = profileResponse.data;
    let user = await userRepository.findByEmail(profile.email);

    if (!user) {
      user = await userRepository.create({
        name: profile.name,
        email: profile.email,
        provider: "google",
        googleId: profile.sub
      });
    }

    const tokens = await tokenService.issueTokens(user, meta);
    return { user, ...tokens };
  }
}
