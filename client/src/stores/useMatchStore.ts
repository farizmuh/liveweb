import { defineStore } from "pinia";
import { ref } from "vue";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";

export interface TeamData {
  id?: string | null;
  name: string;
  shortName: string;
  logoUrl?: string | null;
  colorHex?: string | null;
  score: number;
}

export interface MatchData {
  id: string;
  matchKey: string;
  courtName: string;
  tournamentName: string;
  roundName: string;
  format: "BO1" | "BO3" | "BO5" | "BO7";
  teamA: TeamData;
  teamB: TeamData;
  assignedRefereeId?: string | null;
  assignedRefereeName?: string | null;
  assignedRefereeUsername?: string | null;
  isCompleted: boolean;
  isWaitingForNext?: boolean;
  bracketMatchId?: string | null;
  winnerTeam?: "A" | "B" | null;
  matchPointTeam?: "A" | "B" | null;
  updatedAt: string;
}

export interface SettingsData {
  tickerText: string;
  showTicker: boolean;
  showSponsor: boolean;
}

export const useMatchStore = defineStore("match", () => {
  const socket = ref<Socket | null>(null);
  const isConnected = ref(false);
  const isDBSaved = ref(true);
  const lastSyncTime = ref<string>("");
  const activeKey = ref<string>("");

  const match = ref<MatchData | null>(null);
  const allMatches = ref<MatchData[]>([]);

  const settings = ref<SettingsData>({
    tickerText: "MPL INDONESIA • OFFICIAL ESPORTS TOURNAMENT BROADCAST",
    showTicker: true,
    showSponsor: false,
  });

  function getSocketInstance() {
    if (!socket.value) {
      socket.value = io({
        transports: ["websocket", "polling"],
        reconnectionAttempts: 10,
        reconnectionDelay: 5000,
        reconnectionDelayMax: 15000,
      });

      socket.value.on("connect", () => {
        isConnected.value = true;
        // Re-join active room if set
        if (activeKey.value) {
          socket.value?.emit("join:match", { matchKey: activeKey.value });
        }
      });

      socket.value.on("disconnect", () => {
        isConnected.value = false;
      });

      socket.value.on("match:init", (data) => {
        if (data.match) match.value = data.match;
        if (data.settings) settings.value = data.settings;
        isDBSaved.value = true;
      });

      socket.value.on("match:update", (data) => {
        if (data.match) {
          // If update belongs to our current active key
          if (!activeKey.value || data.match.matchKey === activeKey.value) {
            match.value = data.match;
          }
          // Also update in allMatches list
          const idx = allMatches.value.findIndex((m) => m.matchKey === data.match.matchKey);
          if (idx !== -1) {
            allMatches.value[idx] = data.match;
          }
        }
        if (data.settings) settings.value = data.settings;
        isDBSaved.value = false;
      });

      socket.value.on("matches:overview", (data) => {
        if (data.matches) allMatches.value = data.matches;
        if (data.settings) settings.value = data.settings;
      });

      socket.value.on("db:synced", (data) => {
        if (data.status === "saved") {
          isDBSaved.value = true;
          lastSyncTime.value = new Date().toLocaleTimeString();
        }
      });
    }
    return socket.value;
  }

  function joinMatchRoom(key: string) {
    activeKey.value = key;
    const s = getSocketInstance();
    s.emit("join:match", { matchKey: key });
  }

  function joinSuperadminRoom() {
    const s = getSocketInstance();
    s.emit("join:superadmin");
  }

  // Real-time Action Triggers scoped to matchKey
  function changeScore(team: "A" | "B", delta: number, customKey?: string) {
    const key = customKey || activeKey.value || match.value?.matchKey;
    if (!key) return;

    const s = getSocketInstance();
    if (s.connected) {
      s.emit("score:change", { matchKey: key, team, delta });
    } else {
      const auth = useAuthStore();
      fetch("/api/matches/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ matchKey: key, team, delta }),
      });
    }
  }

  function resetScore(customKey?: string) {
    const key = customKey || activeKey.value || match.value?.matchKey;
    if (!key) return;

    const s = getSocketInstance();
    if (s.connected) {
      s.emit("score:reset", { matchKey: key });
    } else {
      const auth = useAuthStore();
      fetch("/api/matches/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ matchKey: key }),
      });
    }
  }

  function swapSide(customKey?: string) {
    const key = customKey || activeKey.value || match.value?.matchKey;
    if (!key) return;

    const s = getSocketInstance();
    if (s.connected) {
      s.emit("side:swap", { matchKey: key });
    } else {
      const auth = useAuthStore();
      fetch("/api/matches/swap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ matchKey: key }),
      });
    }
  }

  function updateMatchConfig(config: any, customKey?: string) {
    const key = customKey || activeKey.value || match.value?.matchKey;
    if (!key) return;

    const s = getSocketInstance();
    if (s.connected) {
      s.emit("config:update", { matchKey: key, config });
    } else {
      const auth = useAuthStore();
      fetch("/api/matches/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ matchKey: key, config }),
      });
    }
  }

  function setCourtWaitingState(matchKey: string, isWaiting: boolean) {
    const s = getSocketInstance();
    if (s.connected) {
      s.emit("court:set-waiting", { matchKey, isWaiting });
    } else {
      const auth = useAuthStore();
      fetch("/api/matches/waiting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ matchKey, isWaiting }),
      });
    }
  }

  function resetUnassignedCourts() {
    const s = getSocketInstance();
    if (s.connected) {
      s.emit("courts:reset-unassigned");
    } else {
      const auth = useAuthStore();
      fetch("/api/matches/reset-unassigned", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
      });
    }
  }

  function updateSettings(newSettings: Partial<SettingsData>) {
    const s = getSocketInstance();
    if (s.connected) {
      s.emit("settings:update", newSettings);
    } else {
      const auth = useAuthStore();
      fetch("/api/sponsors/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(newSettings),
      });
    }
  }

  return {
    socket,
    isConnected,
    isDBSaved,
    lastSyncTime,
    activeKey,
    match,
    allMatches,
    settings,
    getSocketInstance,
    joinMatchRoom,
    joinSuperadminRoom,
    changeScore,
    resetScore,
    swapSide,
    setCourtWaitingState,
    resetUnassignedCourts,
    updateMatchConfig,
    updateSettings,
  };
});
