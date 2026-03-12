import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import { config } from "./server/core/config";
import { setupProxy } from "./server/core/proxy";
import { setupSocket } from "./server/core/socket";
import jiraRoutes from "./server/modules/jira/jira.routes";
import achievementRoutes from "./server/modules/achievements/achievements.routes";
import actionRoutes from "./server/modules/actions/actions.routes";

// Setup Proxy
setupProxy();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    },
    allowEIO3: true,
    transports: ["polling", "websocket"]
  });

  app.use(express.json());

  // Setup Socket.IO
  setupSocket(io);

  // API Routes
  app.use("/api/jira", jiraRoutes);
  app.use("/api/achievements", achievementRoutes(io));
  app.use("/api/actions", actionRoutes(io));

  // Vite middleware for development
  if (config.NODE_ENV !== "production") {
    console.log("Running in DEVELOPMENT mode (Vite middleware enabled)");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Running in PRODUCTION mode (Serving dist folder)");
    app.use(express.static("dist"));
    // SPA Fallback: serve index.html for any unmatched routes
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(process.cwd(), "dist", "index.html"));
    });
  }

  httpServer.listen(config.PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${config.PORT}`);
  });
}

startServer();

