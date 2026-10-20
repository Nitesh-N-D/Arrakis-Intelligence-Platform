import { Server } from "socket.io";
import { env } from "../config/env.js";
import { verifyAccessToken } from "../utils/jwt.js";

let io;

export const createSocketAuthMiddleware = ({
  verifyToken = verifyAccessToken,
  clock = Date.now
} = {}) => (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) throw new Error("Missing token");
    const payload = verifyToken(token);
    const tokenExpiresAt = Number(payload?.exp) * 1000;
    if (!payload?.sub || !Number.isFinite(tokenExpiresAt) || tokenExpiresAt <= clock()) {
      throw new Error("Invalid or expired token");
    }
    socket.data.userId = payload.sub;
    socket.data.tokenExpiresAt = tokenExpiresAt;
    next();
  } catch (_error) {
    next(new Error("Unauthorized socket connection"));
  }
};

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.allowedOrigins,
      credentials: true
    }
  });

  io.use(createSocketAuthMiddleware());

  io.on("connection", (socket) => {
    if (socket.data.userId) {
      socket.join(`user:${socket.data.userId}`);
      const expiryTimer = setTimeout(() => socket.disconnect(true), Math.max(1, socket.data.tokenExpiresAt - Date.now()));
      expiryTimer.unref?.();
      socket.once("disconnect", () => clearTimeout(expiryTimer));
    }
  });

  return io;
};

export const getIo = () => io;
