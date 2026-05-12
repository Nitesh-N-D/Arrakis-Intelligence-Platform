import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { BillingController } from "./controllers/billingController.js";
import { configurePassport, passport } from "./config/passport.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { rateLimitMiddleware } from "./middleware/rateLimitMiddleware.js";
import routes from "./routes/index.js";

const app = express();
const billingController = new BillingController();

configurePassport();

app.use(
  cors({
    origin: [env.clientUrl, env.appUrl],
    credentials: true
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.post(
  "/api/v1/billing/webhook",
  express.raw({ type: "application/json" }),
  (req, _res, next) => {
    req.rawBody = req.body.toString("utf8");
    next();
  },
  (req, res, next) => billingController.webhook(req, res).catch(next)
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(rateLimitMiddleware());

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Arrakis Intelligence Platform server is healthy.",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/v1", routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
