import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  appUrl: process.env.APP_URL || process.env.CLIENT_URL || "http://localhost:5173",
  googleSuccessRedirectUrl:
    process.env.GOOGLE_SUCCESS_REDIRECT_URL || "http://localhost:5173/auth/callback",
  googleFailureRedirectUrl:
    process.env.GOOGLE_FAILURE_REDIRECT_URL || "http://localhost:5173/login?error=google_auth_failed",
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
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
  stripePriceProMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
  stripeSuccessUrl:
    process.env.STRIPE_SUCCESS_URL || `${process.env.CLIENT_URL || "http://localhost:5173"}/pricing?checkout=success`,
  stripeCancelUrl:
    process.env.STRIPE_CANCEL_URL || `${process.env.CLIENT_URL || "http://localhost:5173"}/pricing?checkout=cancelled`,
  stripePortalReturnUrl:
    process.env.STRIPE_PORTAL_RETURN_URL || `${process.env.CLIENT_URL || "http://localhost:5173"}/pricing`,
  mentatProvider: process.env.MENTAT_PROVIDER || "heuristic",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-5",
  googleSiteVerification: process.env.GOOGLE_SITE_VERIFICATION || "",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 300)
};

if (env.nodeEnv === "production") {
  const productionErrors = [];

  if (!process.env.JWT_ACCESS_SECRET || env.jwtAccessSecret === "dev-access-secret") {
    productionErrors.push("JWT_ACCESS_SECRET must be set to a strong value in production.");
  }

  if (!process.env.JWT_REFRESH_SECRET || env.jwtRefreshSecret === "dev-refresh-secret") {
    productionErrors.push("JWT_REFRESH_SECRET must be set to a strong value in production.");
  }

  if (!process.env.MONGODB_URI) {
    productionErrors.push("MONGODB_URI must be configured in production.");
  }

  if (productionErrors.length > 0) {
    throw new Error(productionErrors.join(" "));
  }
}
