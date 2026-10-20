import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "./env.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { createGoogleOAuthStateStore } from "./googleOAuthStateStore.js";

const userRepository = new UserRepository();

let configured = false;

export const createGoogleVerifyCallback = (repository = new UserRepository()) => async (_accessToken, _refreshToken, profile, done) => {
  try {
    const verifiedEmail = profile.emails?.find((item) => item.verified === true)?.value;
    const email = verifiedEmail?.trim().toLowerCase();
    if (!email) {
      return done(new Error("Google account does not expose a verified email address"));
    }

    let user = await repository.findByGoogleId(profile.id);

    if (!user) {
      user = await repository.findByEmail(email);
    }

    if (!user) {
      user = await repository.create({
        name: profile.displayName || email.split("@")[0],
        email,
        provider: "google",
        googleId: profile.id
      });
    } else if (user.googleId !== profile.id || user.provider !== "google") {
      user = await repository.updateById(user.id, {
        googleId: profile.id,
        provider: "google",
        name: user.name || profile.displayName || email.split("@")[0]
      });
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
};

export const configurePassport = () => {
  if (configured || !env.googleClientId || !env.googleClientSecret) {
    return passport;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: env.googleRedirectUri,
        store: createGoogleOAuthStateStore()
      },
      createGoogleVerifyCallback(userRepository)
    )
  );

  configured = true;
  return passport;
};

export const isGoogleOAuthConfigured = () => Boolean(env.googleClientId && env.googleClientSecret);

export { passport };
