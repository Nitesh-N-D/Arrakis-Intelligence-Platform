import dotenv from "dotenv";

dotenv.config();

const parseAllowedOrigins = () => {
  const values = [
    process.env.CLIENT_URL,
    process.env.APP_URL,
    ...(process.env.ALLOWED_ORIGINS || "").split(",")
  ];

  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
};

export const readBoundedNumber = (name, fallback, { min, max, integer = true } = {}) => {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) {
    throw new Error(`${name} must be a ${integer ? "whole number" : "number"} between ${min} and ${max}.`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: readBoundedNumber("PORT", 5000, { min: 1, max: 65535 }),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  appUrl: process.env.APP_URL || process.env.CLIENT_URL || "http://localhost:5173",
  allowedOrigins: parseAllowedOrigins(),
  googleSuccessRedirectUrl:
    process.env.GOOGLE_SUCCESS_REDIRECT_URL ||
    `${process.env.CLIENT_URL || "http://localhost:5173"}/auth/callback`,
  googleFailureRedirectUrl:
    process.env.GOOGLE_FAILURE_REDIRECT_URL ||
    `${process.env.CLIENT_URL || "http://localhost:5173"}/login?error=google_auth_failed`,
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/arrakis-intelligence",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || "dev-access-secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  googleRedirectUri:
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/v1/auth/google/callback",
  refreshCookieName: process.env.REFRESH_COOKIE_NAME || "arrakis_refresh_token",
  secureCookies: process.env.SECURE_COOKIES === "true",
  mentatProvider: String(process.env.MENTAT_PROVIDER || "heuristic").trim().toLowerCase(),
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
  geminiTimeoutMs: readBoundedNumber("GEMINI_TIMEOUT_MS", 15000, { min: 1000, max: 60000 }),
  mentatMaxOutputTokens: readBoundedNumber("MENTAT_MAX_OUTPUT_TOKENS", 800, { min: 128, max: 4000 }),
  mentatMaxRequestsPerUserDay: readBoundedNumber("MENTAT_MAX_REQUESTS_PER_USER_DAY", 20, { min: 1, max: 1000000 }),
  mentatMaxRequestsGlobalDay: readBoundedNumber("MENTAT_MAX_REQUESTS_GLOBAL_DAY", 1000, { min: 1, max: 10000000 }),
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-5",
  googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION || "",
  rateLimitWindowMs: readBoundedNumber("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000, { min: 1000, max: 24 * 60 * 60 * 1000 }),
  rateLimitMax: readBoundedNumber("RATE_LIMIT_MAX", 300, { min: 1, max: 1000000 })
};

if (!["heuristic", "openai", "gemini"].includes(env.mentatProvider)) {
  throw new Error("MENTAT_PROVIDER must be heuristic, openai, or gemini.");
}

if (env.nodeEnv === "production") {
  const productionErrors = [];

  if (!process.env.JWT_ACCESS_SECRET || env.jwtAccessSecret === "dev-access-secret") {
    productionErrors.push("JWT_ACCESS_SECRET must be set to a strong value in production.");
  }

  if ((process.env.JWT_ACCESS_SECRET || "").length < 32) {
    productionErrors.push("JWT_ACCESS_SECRET must contain at least 32 characters in production.");
  }

  if (!process.env.JWT_REFRESH_SECRET || env.jwtRefreshSecret === "dev-refresh-secret") {
    productionErrors.push("JWT_REFRESH_SECRET must be set to a strong value in production.");
  }

  if ((process.env.JWT_REFRESH_SECRET || "").length < 32) {
    productionErrors.push("JWT_REFRESH_SECRET must contain at least 32 characters in production.");
  }

  if (!process.env.MONGODB_URI) {
    productionErrors.push("MONGODB_URI must be configured in production.");
  }

  if (!env.allowedOrigins.length) {
    productionErrors.push("ALLOWED_ORIGINS or CLIENT_URL must be configured in production.");
  }

  if (!env.secureCookies) {
    productionErrors.push("SECURE_COOKIES must be true in production.");
  }

  if (productionErrors.length > 0) {
    throw new Error(productionErrors.join(" "));
  }
}
