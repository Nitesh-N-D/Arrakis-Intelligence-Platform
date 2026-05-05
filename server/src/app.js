import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { configurePassport, passport } from "./config/passport.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import routes from "./routes/index.js";

const app = express();

configurePassport();

app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

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
