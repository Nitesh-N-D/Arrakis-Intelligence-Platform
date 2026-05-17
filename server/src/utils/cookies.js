import { env } from "../config/env.js";

const getCookieBaseOptions = () => ({
  httpOnly: true,
  sameSite: env.secureCookies ? "none" : "lax",
  secure: env.secureCookies,
  path: "/"
});

const parseDuration = (value) => {
  const amount = Number.parseInt(value, 10);

  if (value.endsWith("d")) return amount * 24 * 60 * 60 * 1000;
  if (value.endsWith("h")) return amount * 60 * 60 * 1000;
  if (value.endsWith("m")) return amount * 60 * 1000;
  return amount * 1000;
};

export const setRefreshTokenCookie = (res, token) => {
  res.cookie(env.refreshCookieName, token, {
    ...getCookieBaseOptions(),
    maxAge: parseDuration(env.jwtRefreshExpiresIn)
  });
};

export const clearRefreshTokenCookie = (res) => {
  res.clearCookie(env.refreshCookieName, getCookieBaseOptions());
};

export const getRefreshTokenFromRequest = (req) => req.cookies?.[env.refreshCookieName] || null;
