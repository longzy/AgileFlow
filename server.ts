import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import { config } from "./server/config";
import { setupProxy } from "./server/utils/proxy";
import { setupSocket } from "./server/socket";
import jiraRoutes from "./server/routes/jira";

// Setup Proxy
setupProxy();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(express.json());

  // Setup Socket.IO
  setupSocket(io);

  // API Routes
  app.use("/api/jira", jiraRoutes);

  // Vite middleware for development
  if (config.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  httpServer.listen(config.PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${config.PORT}`);
  });
}

startServer();

