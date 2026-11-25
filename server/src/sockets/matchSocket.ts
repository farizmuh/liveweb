import { Server as SocketIOServer, Socket } from "socket.io";
import { matchState } from "../services/matchState.js";
import { bracketService } from "../services/bracketService.js";
import { prisma } from "../config/db.js";

export function setupMatchSocket(io: SocketIOServer) {
  matchState.setSocketServer(io);
  bracketService.setSocketServer(io);

  // Batasi koneksi Socket.io maksimal 30 koneksi bersamaan (hemat proses & resource hosting)
  const MAX_SOCKET_CONNECTIONS = 30;
  io.use((socket, next) => {
    const currentCount = io.engine.clientsCount;
    if (currentCount > MAX_SOCKET_CONNECTIONS) {
      return next(new Error("Kapasitas server penuh (maksimal 30 koneksi live)."));
    }
    next();
  });

  io.on("connection", (socket: Socket) => {
    // 1. Client joins a specific match room (by matchKey)
    socket.on("join:match", ({ matchKey }: { matchKey: string }) => {
      if (!matchKey) return;
      socket.join(matchKey);

      const match = matchState.getMatchByKey(matchKey);
      const settings = matchState.getSettings();

      socket.emit("match:init", {
        match,
        settings,
        timestamp: new Date().toISOString(),
      });
    });

    // 2. Superadmin joins central monitoring room
    socket.on("join:superadmin", () => {
      socket.join("superadmin_room");
      socket.emit("matches:overview", {
        matches: matchState.getAllMatches(),
        settings: matchState.getSettings(),
      });
    });

    // 3. Client joins bracket room (for OBS bracket overlay or Admin bracket view)
    socket.on("join:bracket", async ({ tournamentId }: { tournamentId?: string }) => {
      try {
        socket.join("bracket_room");
        const tournament = await bracketService.getTournamentBracket(tournamentId);
        socket.emit("bracket:init", { tournament });
      } catch (err) {
        console.error("[Socket Error] Gagal memuat bagan di join:bracket:", err);
      }
    });

    // 3b. Sinkronisasi Live Rolet Pengacakan Tim antara Admin & OBS Overlay
    socket.on("bracket:roulette:start", () => {
      io.to("bracket_room").emit("bracket:roulette:start");
    });

    socket.on("bracket:roulette:stop", () => {
      io.to("bracket_room").emit("bracket:roulette:stop");
    });

    // 4. Score Actions scoped by matchKey
    socket.on("score:change", async ({ matchKey, team, delta }: { matchKey: string; team: "A" | "B"; delta: number }) => {
      try {
        if (!matchKey) return;
        matchState.updateScore(matchKey, team, delta);
        // Synchronize live score to bracket if match is linked
        await bracketService.syncLiveScoreFromCourt(matchKey);
      } catch (err) {
        console.error("[Socket Error] Gagal update score:", err);
      }
    });

    socket.on("score:reset", ({ matchKey }: { matchKey: string }) => {
      if (!matchKey) return;
      matchState.resetScore(matchKey);
    });

    socket.on("side:swap", ({ matchKey }: { matchKey: string }) => {
      if (!matchKey) return;
      matchState.swapSide(matchKey);
    });

    socket.on("config:update", ({ matchKey, config }: { matchKey: string; config: any }) => {
      if (!matchKey) return;
      matchState.updateMatchConfig(matchKey, config);
    });

    socket.on("court:set-waiting", async ({ matchKey, isWaiting }: { matchKey: string; isWaiting: boolean }) => {
      try {
        if (!matchKey) return;
        matchState.setCourtWaitingState(matchKey, isWaiting);
        if (isWaiting) {
          await prisma.bracketMatch.updateMany({
            where: { courtMatchKey: matchKey, status: "LIVE" },
            data: {
              status: "READY",
              assignedCourt: null,
              courtMatchKey: null,
            },
          });
          bracketService.broadcastBracket();
        }
      } catch (err) {
        console.error("[Socket Error] Gagal set court waiting:", err);
      }
    });

    socket.on("courts:reset-unassigned", async () => {
      try {
        matchState.resetUnassignedCourtsToWaiting();
        const allMatches = matchState.getAllMatches();
        for (const court of allMatches) {
          if (court.isWaitingForNext) {
            await prisma.bracketMatch.updateMany({
              where: { courtMatchKey: court.matchKey, status: "LIVE" },
              data: {
                status: "READY",
                assignedCourt: null,
                courtMatchKey: null,
              },
            });
          }
        }
        bracketService.broadcastBracket();
      } catch (err) {
        console.error("[Socket Error] Gagal reset unassigned courts:", err);
      }
    });

    socket.on("settings:update", (newSettings) => {
      matchState.updateSettings(newSettings);
    });
  });
}
