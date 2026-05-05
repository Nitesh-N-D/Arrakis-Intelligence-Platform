import http from "http";
import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { initializeSocket } from "./socket/index.js";

const startServer = async () => {
  await connectDatabase();

  const server = http.createServer(app);
  initializeSocket(server);

  server.listen(env.port, () => {
    console.log(`Arrakis server listening on port ${env.port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start Arrakis server", error);
  process.exit(1);
});
