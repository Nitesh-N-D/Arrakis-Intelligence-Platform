import http from "http";
import mongoose from "mongoose";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { initializeSocket } from "./socket/index.js";

const startServer = async () => {
  await connectDatabase();
  const server = http.createServer(app);
  const io = initializeSocket(server);
  let shuttingDown = false;

  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Arrakis server shutting down (${signal})`);
    try {
      await io.close();
      await mongoose.disconnect();
      console.log("Arrakis server shutdown complete");
    } catch (error) {
      console.error("Arrakis server shutdown failed", error?.name || "Error");
      process.exitCode = 1;
    }
  };

  process.once("SIGINT", () => { void shutdown("SIGINT"); });
  process.once("SIGTERM", () => { void shutdown("SIGTERM"); });

  server.listen(env.port, () => {
    console.log(`Arrakis server listening on port ${env.port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server", error?.name || "Error");
  process.exit(1);
});
