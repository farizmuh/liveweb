import { Server as SocketIOServer, Socket } from "socket.io";
import { matchState } from "../services/matchState.js";
import { bracketService } from "../services/bracketService.js";

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
      socket.join("bracket_room");
      const tournament = await bracketService.getTournamentBracket(tournamentId);
      socket.emit("bracket:init", { tournament });
    });

    // 4. Score Actions scoped by matchKey
    socket.on("score:change", async ({ matchKey, team, delta }: { matchKey: string; team: "A" | "B"; delta: number }) => {
      if (!matchKey) return;
      matchState.updateScore(matchKey, team, delta);
      // Synchronize live score to bracket if match is linked
      await bracketService.syncLiveScoreFromCourt(matchKey);
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

    socket.on("court:set-waiting", ({ matchKey, isWaiting }: { matchKey: string; isWaiting: boolean }) => {
      if (!matchKey) return;
      matchState.setCourtWaitingState(matchKey, isWaiting);
    });

    socket.on("courts:reset-unassigned", () => {
      matchState.resetUnassignedCourtsToWaiting();
    });

    socket.on("settings:update", (newSettings) => {
      matchState.updateSettings(newSettings);
    });
  });
}
