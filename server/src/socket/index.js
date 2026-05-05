import { Server } from "socket.io";
import { env } from "../config/env.js";
import { verifyAccessToken } from "../utils/jwt.js";

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (token) {
        const payload = verifyAccessToken(token);
        socket.data.userId = payload.sub;
      }
      next();
    } catch (_error) {
      next(new Error("Unauthorized socket connection"));
    }
  });

  io.on("connection", (socket) => {
    if (socket.data.userId) {
      socket.join(`user:${socket.data.userId}`);
    }
  });

  return io;
};

export const getIo = () => io;
