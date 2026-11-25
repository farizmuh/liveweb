import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Muat .env dengan fallback path absolut (karena cPanel Passenger sering beda CWD)
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { setupMatchSocket } from "./sockets/matchSocket.js";
import { matchState } from "./services/matchState.js";
import { bracketService } from "./services/bracketService.js";
import { requireAuth, requireRole } from "./middlewares/auth.js";
import { upload } from "./middlewares/upload.js";

// Controllers
import * as authController from "./controllers/authController.js";
import * as userController from "./controllers/userController.js";
import * as teamController from "./controllers/teamController.js";
import * as matchController from "./controllers/matchController.js";
import * as sponsorController from "./controllers/sponsorController.js";
import * as bracketController from "./controllers/bracketController.js";

const app = express();
const server = http.createServer(app);

// Passenger pada cPanel menyediakan port via env PASSENGER_BASE_URI atau via 'passenger' module
// Juga bisa binding ke socket file jika disediakan oleh lsnode/Passenger
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

// Auth & User Management Routes
app.post("/api/auth/login", authController.login);
app.get("/api/auth/me", requireAuth, authController.getProfile);
app.get("/api/users", requireAuth, requireRole(["SUPERADMIN"]), userController.listUsers);
app.post("/api/users", requireAuth, requireRole(["SUPERADMIN"]), userController.createUser);
app.put("/api/users/:id", requireAuth, requireRole(["SUPERADMIN"]), userController.updateUser);
app.delete("/api/users/:id", requireAuth, requireRole(["SUPERADMIN"]), userController.deleteUser);

// Team Routes
app.get("/api/teams", teamController.listTeams);
app.post("/api/teams", requireAuth, upload.single("logo"), teamController.createTeam);
app.post("/api/teams/bulk", requireAuth, teamController.bulkCreateTeams);
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
app.post("/api/matches/waiting", requireAuth, matchController.setWaitingState);
app.post("/api/matches/reset-unassigned", requireAuth, matchController.resetUnassignedCourts);

// Sponsor Routes
app.get("/api/sponsors", sponsorController.getSponsorSettings);
app.put("/api/sponsors/settings", requireAuth, sponsorController.updateSettings);
app.post("/api/sponsors", requireAuth, upload.single("logo"), sponsorController.createSponsor);
app.delete("/api/sponsors/:id", requireAuth, sponsorController.deleteSponsor);

// Tournament Bracket Routes
app.get("/api/bracket/active", bracketController.getActiveBracket);
app.get("/api/bracket/all", bracketController.listTournaments);
app.post("/api/bracket/create", requireAuth, bracketController.createBracket);
app.post("/api/bracket/shuffle", requireAuth, bracketController.shuffleBracket);
app.post("/api/bracket/finalize", requireAuth, bracketController.finalizeBracket);
app.post("/api/bracket/assign", requireAuth, bracketController.assignToCourt);
app.post("/api/bracket/unassign", requireAuth, bracketController.unassignFromCourt);
app.post("/api/bracket/finish", requireAuth, bracketController.finishMatch);

// Specific redirects for .html routes
app.get("/admin.html", (_req, res) => res.redirect("/admin"));
app.get("/overlay.html", (_req, res) => res.redirect("/overlay"));
app.get("/overlay/bottom.html", (_req, res) => res.redirect("/overlay/bottom"));
app.get("/overlay-bottom.html", (_req, res) => res.redirect("/overlay/bottom"));
app.get("/overlay/bracket.html", (_req, res) => res.redirect("/overlay/bracket"));
app.get("/bracket.html", (_req, res) => res.redirect("/bracket"));
app.get("/users.html", (_req, res) => res.redirect("/users"));

// Serve Frontend client build in production
const publicFromDirname = path.resolve(__dirname, "../public");
const localPublicDir = fs.existsSync(publicFromDirname)
  ? publicFromDirname
  : path.resolve(process.cwd(), "public");
const clientDist = fs.existsSync(localPublicDir)
  ? localPublicDir
  : path.resolve(process.cwd(), "../client/dist");

app.use(express.static(clientDist));
app.get("*", (_req, res, next) => {
  if (_req.path.startsWith("/api") || _req.path.startsWith("/uploads")) {
    return next();
  }
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) {
      // In development (when client/dist is not built), redirect to the Vite frontend server
      const clientOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
      return res.redirect(`${clientOrigin}${_req.originalUrl}`);
    }
  });
});

// Initialize State and Listen
async function startServer() {
  try {
    await matchState.initializeFromDB();
  } catch (err) {
    console.error("[MatchState] Init error (non-fatal, server tetap berjalan):", err);
  }

  try {
    await bracketService.syncAllCourtsWithBracket();
  } catch (err) {
    console.error("[BracketService] Sync error (non-fatal, server tetap berjalan):", err);
  }

  // Deteksi lingkungan cPanel Phusion Passenger vs Localhost
  // PENTING: Di cPanel Passenger, wajib menggunakan socket 'passenger' atau env PORT dari Passenger
  // agar tidak bentrok di port 3000 dan tidak memicu penumpukan proses zombie (100/100 NPROC)
  let listenTarget: any = PORT;
  if (typeof (globalThis as any).PhusionPassenger !== "undefined") {
    listenTarget = "passenger";
  } else if (process.env.PASSENGER_APP_ENV || process.env.PASSENGER_BASE_URI) {
    listenTarget = process.env.PORT || "passenger";
  } else if (process.env.PASSENGER_LISTEN_SOCKET) {
    listenTarget = process.env.PASSENGER_LISTEN_SOCKET;
  }

  // Tangani error port bentrok (EADDRINUSE) secara tegas
  server.on("error", (err: any) => {
    console.error("[Server Error]", err);
    if (err.code === "EADDRINUSE") {
      console.error(`[Server Anti-Zombie] Port/Socket ${listenTarget} sudah terpakai oleh proses lain! Menghentikan proses ini agar tidak menumpuk...`);
      // Wajib exit jika port sudah diambil proses lain agar tidak jadi proses zombie di cPanel
      process.exit(1);
    }
  });

  server.listen(listenTarget, () => {
    console.log(`=======================================================`);
    console.log(`🎮 ESPORTS OVERLAY SERVER RUNNING`);
    console.log(`📡 Listening on: ${listenTarget}`);
    console.log(`📡 Socket.io ready for OBS & Admin real-time sync`);
    console.log(`📁 Uploads served at /uploads`);
    console.log(`=======================================================`);
  });
}

// Tangkal crash loop & cegah proses zombie
process.on("uncaughtException", (err: any) => {
  console.error("[Server Anti-Crash] Uncaught Exception:", err);
  if (err?.code === "EADDRINUSE") {
    process.exit(1);
  }
});

process.on("unhandledRejection", (reason) => {
  console.error("[Server Anti-Crash] Unhandled Rejection:", reason);
});

// Graceful shutdown saat Passenger mematikan proses karena idle / timeout
async function handleShutdown(signal: string) {
  console.log(`[Server] Menerima sinyal ${signal}. Menutup koneksi database dan socket secara bersih...`);
  try {
    io.close();
    server.close();
    const { prisma } = await import("./config/db.js");
    await prisma.$disconnect();
  } catch (err) {
    console.error("[Server] Error saat shutdown:", err);
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));

startServer();

