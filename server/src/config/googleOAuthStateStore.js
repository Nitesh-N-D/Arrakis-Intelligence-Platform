import { randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "./env.js";

export const googleOAuthStateCookie = "arrakis_google_oauth_state";
const cookiePath = "/api/v1/auth/google";
const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.secureCookies,
  path: cookiePath
};
const statePattern = /^[A-Za-z0-9_-]{43}$/;

const stateMatches = (expected, provided) => {
  if (typeof expected !== "string" || typeof provided !== "string") return false;
  if (!statePattern.test(expected) || !statePattern.test(provided)) return false;
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  return timingSafeEqual(expectedBytes, providedBytes);
};

export const createGoogleOAuthStateStore = () => ({
  store(req, _state, _meta, callback) {
    const state = randomBytes(32).toString("base64url");
    if (!req.res?.cookie) return callback(new Error("OAuth state cookie response is unavailable"));
    req.res.cookie(googleOAuthStateCookie, state, {
      ...cookieOptions,
      maxAge: 10 * 60 * 1000
    });
    callback(null, state);
  },

  verify(req, providedState, callback) {
    const expected = req.cookies?.[googleOAuthStateCookie];
    req.res?.clearCookie?.(googleOAuthStateCookie, cookieOptions);
    if (!stateMatches(expected, providedState)) {
      return callback(null, false, { message: "Unable to verify Google authorization state." });
    }
    return callback(null, true);
  }
});
