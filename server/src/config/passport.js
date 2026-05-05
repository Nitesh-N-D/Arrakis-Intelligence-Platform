import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "./env.js";
import { UserRepository } from "../repositories/UserRepository.js";

const userRepository = new UserRepository();

let configured = false;

export const configurePassport = () => {
  if (configured || !env.googleClientId || !env.googleClientSecret) {
    return passport;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.googleClientId,
        clientSecret: env.googleClientSecret,
        callbackURL: env.googleRedirectUri
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) {
            return done(new Error("Google account does not expose an email address"));
          }

          let user = await userRepository.findByGoogleId(profile.id);

          if (!user) {
            user = await userRepository.findByEmail(email);
          }

          if (!user) {
            user = await userRepository.create({
              name: profile.displayName || email.split("@")[0],
              email,
              provider: "google",
              googleId: profile.id
            });
          } else if (user.googleId !== profile.id || user.provider !== "google") {
            user = await userRepository.updateById(user.id, {
              googleId: profile.id,
              provider: "google",
              name: user.name || profile.displayName || email.split("@")[0]
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  configured = true;
  return passport;
};

export const isGoogleOAuthConfigured = () => Boolean(env.googleClientId && env.googleClientSecret);

export { passport };
