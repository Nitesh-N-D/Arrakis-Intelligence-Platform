import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
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
    process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/v1/auth/google/callback"
};
