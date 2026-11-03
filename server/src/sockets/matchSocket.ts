import { Server as SocketIOServer, Socket } from "socket.io";
import { matchState } from "../services/matchState.js";

export function setupMatchSocket(io: SocketIOServer) {
  matchState.setSocketServer(io);

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

    // 3. Score Actions scoped by matchKey
    socket.on("score:change", ({ matchKey, team, delta }: { matchKey: string; team: "A" | "B"; delta: number }) => {
      if (!matchKey) return;
      matchState.updateScore(matchKey, team, delta);
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

    socket.on("settings:update", (newSettings) => {
      matchState.updateSettings(newSettings);
    });
  });
}
