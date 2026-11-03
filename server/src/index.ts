import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

import { setupMatchSocket } from "./sockets/matchSocket.js";
import { matchState } from "./services/matchState.js";
import { requireAuth } from "./middlewares/auth.js";
import { upload } from "./middlewares/upload.js";

// Controllers
import * as authController from "./controllers/authController.js";
import * as teamController from "./controllers/teamController.js";
import * as matchController from "./controllers/matchController.js";
import * as sponsorController from "./controllers/sponsorController.js";

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

// Socket.io configuration
const io = new SocketIOServer(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
  pingTimeout: 5000,
  pingInterval: 10000,
});

// Setup sockets
setupMatchSocket(io);

// Middlewares
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded logos
const uploadsPath = path.resolve(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsPath));

// Auth Routes
app.post("/api/auth/login", authController.login);
app.get("/api/auth/me", requireAuth, authController.getProfile);

// Team Routes
app.get("/api/teams", teamController.listTeams);
app.post("/api/teams", requireAuth, upload.single("logo"), teamController.createTeam);
app.put("/api/teams/:id", requireAuth, upload.single("logo"), teamController.updateTeam);
app.delete("/api/teams/:id", requireAuth, teamController.deleteTeam);

// Match Routes
app.get("/api/matches/active", matchController.getActiveMatch);
app.get("/api/matches/assigned", requireAuth, matchController.getMyAssignedMatch);
app.get("/api/matches", matchController.listMatches);
app.post("/api/matches", requireAuth, matchController.createMatch);
app.post("/api/matches/assign-referee", requireAuth, matchController.assignReferee);
app.post("/api/matches/score", requireAuth, matchController.changeScore);
app.post("/api/matches/reset", requireAuth, matchController.resetScore);
app.post("/api/matches/swap", requireAuth, matchController.swapSide);
app.put("/api/matches/config", requireAuth, matchController.updateConfig);

// Sponsor Routes
app.get("/api/sponsors", sponsorController.getSponsorSettings);
app.put("/api/sponsors/settings", requireAuth, sponsorController.updateSettings);
app.post("/api/sponsors", requireAuth, upload.single("logo"), sponsorController.createSponsor);
app.delete("/api/sponsors/:id", requireAuth, sponsorController.deleteSponsor);

// Specific redirects for .html routes
app.get("/admin.html", (_req, res) => res.redirect("/admin"));
app.get("/overlay.html", (_req, res) => res.redirect("/overlay"));
app.get("/overlay/bottom.html", (_req, res) => res.redirect("/overlay/bottom"));
app.get("/overlay-bottom.html", (_req, res) => res.redirect("/overlay/bottom"));

// Serve Frontend client build in production
const clientDist = path.resolve(process.cwd(), "../client/dist");
app.use(express.static(clientDist));
app.get("*", (_req, res, next) => {
  if (_req.path.startsWith("/api") || _req.path.startsWith("/uploads")) {
    return next();
  }
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next();
  });
});

// Initialize State and Listen
async function startServer() {
  await matchState.initializeFromDB();

  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🎮 ESPORTS OVERLAY SERVER RUNNING ON PORT ${PORT}`);
    console.log(`📡 Socket.io ready for OBS & Admin real-time sync`);
    console.log(`📁 Uploads served at /uploads`);
    console.log(`=======================================================`);
  });
}

startServer();

