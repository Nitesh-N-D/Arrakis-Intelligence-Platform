import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { configurePassport, passport } from "./config/passport.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { rateLimitMiddleware } from "./middleware/rateLimitMiddleware.js";
import routes from "./routes/index.js";

const app = express();

configurePassport();
app.set("trust proxy", env.nodeEnv === "production" ? 1 : false);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    if (env.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(rateLimitMiddleware());

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Arrakis Intelligence Platform server is healthy.",
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv
  });
});

app.use("/api/v1", routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
