import { defineStore } from "pinia";
import { ref } from "vue";
import { io } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
export const useMatchStore = defineStore("match", () => {
    const socket = ref(null);
    const isConnected = ref(false);
    const isDBSaved = ref(true);
    const lastSyncTime = ref("");
    const activeKey = ref("");
    const match = ref(null);
    const allMatches = ref([]);
    const settings = ref({
        tickerText: "MPL INDONESIA • OFFICIAL ESPORTS TOURNAMENT BROADCAST",
        showTicker: true,
        showSponsor: false,
    });
    function getSocketInstance() {
        if (!socket.value) {
            socket.value = io({
                transports: ["websocket", "polling"],
                reconnectionAttempts: 20,
                reconnectionDelay: 1000,
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
                if (data.match)
                    match.value = data.match;
                if (data.settings)
                    settings.value = data.settings;
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
                if (data.settings)
                    settings.value = data.settings;
                isDBSaved.value = false;
            });
            socket.value.on("matches:overview", (data) => {
                if (data.matches)
                    allMatches.value = data.matches;
                if (data.settings)
                    settings.value = data.settings;
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
    function joinMatchRoom(key) {
        activeKey.value = key;
        const s = getSocketInstance();
        s.emit("join:match", { matchKey: key });
    }
    function joinSuperadminRoom() {
        const s = getSocketInstance();
        s.emit("join:superadmin");
    }
    // Real-time Action Triggers scoped to matchKey
    function changeScore(team, delta, customKey) {
        const key = customKey || activeKey.value || match.value?.matchKey;
        if (!key)
            return;
        const s = getSocketInstance();
        if (s.connected) {
            s.emit("score:change", { matchKey: key, team, delta });
        }
        else {
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
    function resetScore(customKey) {
        const key = customKey || activeKey.value || match.value?.matchKey;
        if (!key)
            return;
        const s = getSocketInstance();
        if (s.connected) {
            s.emit("score:reset", { matchKey: key });
        }
        else {
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
    function swapSide(customKey) {
        const key = customKey || activeKey.value || match.value?.matchKey;
        if (!key)
            return;
        const s = getSocketInstance();
        if (s.connected) {
            s.emit("side:swap", { matchKey: key });
        }
        else {
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
    function updateMatchConfig(config, customKey) {
        const key = customKey || activeKey.value || match.value?.matchKey;
        if (!key)
            return;
        const s = getSocketInstance();
        if (s.connected) {
            s.emit("config:update", { matchKey: key, config });
        }
        else {
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
    function updateSettings(newSettings) {
        const s = getSocketInstance();
        if (s.connected) {
            s.emit("settings:update", newSettings);
        }
        else {
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
        updateMatchConfig,
        updateSettings,
    };
});
//# sourceMappingURL=useMatchStore.js.map