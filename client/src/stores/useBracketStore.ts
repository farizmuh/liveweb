import { defineStore } from "pinia";
import { ref } from "vue";
import { useMatchStore } from "./useMatchStore";
import { useAuthStore } from "./useAuthStore";

export interface BracketTeam {
  id?: string | null;
  name?: string | null;
  shortName?: string | null;
  logoUrl?: string | null;
  colorHex?: string | null;
  institution?: string | null;
}

export interface BracketMatchNode {
  id: string;
  tournamentId: string;
  round: number;
  roundName: string;
  section: "UPPER" | "LOWER" | "GRAND_FINAL";
  matchOrder: number;
  teamAId?: string | null;
  teamA?: BracketTeam | null;
  teamAName?: string | null;
  teamAShort?: string | null;
  teamALogo?: string | null;
  teamAInstitution?: string | null;
  scoreA: number;
  teamBId?: string | null;
  teamB?: BracketTeam | null;
  teamBName?: string | null;
  teamBShort?: string | null;
  teamBLogo?: string | null;
  teamBInstitution?: string | null;
  scoreB: number;
  isBye: boolean;
  winnerTeam?: string | null;
  winnerTeamId?: string | null;
  status: "PENDING" | "READY" | "LIVE" | "COMPLETED";
  nextMatchId?: string | null;
  nextMatchSlot?: string | null;
  loserMatchId?: string | null;
  loserMatchSlot?: string | null;
  assignedCourt?: string | null;
  courtMatchKey?: string | null;
}

export interface TournamentData {
  id: string;
  name: string;
  type: "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION";
  status: "DRAFT" | "FINALIZED" | "IN_PROGRESS" | "COMPLETED";
  format: "BO1" | "BO3" | "BO5" | "BO7";
  matches: BracketMatchNode[];
}

export const useBracketStore = defineStore("bracket", () => {
  const tournament = ref<TournamentData | null>(null);
  const tournamentsList = ref<any[]>([]);
  const loading = ref(false);

  function initSocket(tournamentId?: string) {
    const matchStore = useMatchStore();
    const s = matchStore.getSocketInstance();

    s.emit("join:bracket", { tournamentId });

    s.off("bracket:init");
    s.on("bracket:init", (data) => {
      if (data.tournament) tournament.value = data.tournament;
    });

    s.off("bracket:update");
    s.on("bracket:update", (data) => {
      if (!tournamentId || data.tournamentId === tournamentId || !data.tournamentId) {
        fetchActiveBracket(tournamentId);
      }
    });
  }

  async function fetchActiveBracket(tournamentId?: string) {
    loading.value = true;
    try {
      const url = tournamentId ? `/api/bracket/active?id=${tournamentId}` : "/api/bracket/active";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        tournament.value = data.tournament || null;
      }
    } catch (err) {
      console.error("Gagal mengambil bagan turnamen:", err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchTournaments() {
    try {
      const res = await fetch("/api/bracket/all");
      if (res.ok) {
        const data = await res.json();
        tournamentsList.value = data.tournaments || [];
      }
    } catch (err) {
      console.error("Gagal memuat turnamen:", err);
    }
  }

  async function createBracket(payload: {
    name: string;
    type: "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION";
    teamIds: string[];
    format?: string;
  }) {
    const authStore = useAuthStore();
    const res = await fetch("/api/bracket/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal membuat bagan.");
    tournament.value = data.tournament;
    return data.tournament;
  }

  async function shuffleBracket(tournamentId: string) {
    const authStore = useAuthStore();
    const res = await fetch("/api/bracket/shuffle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify({ tournamentId }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal mengacak bagan.");
    tournament.value = data.tournament;
    return data;
  }

  async function finalizeBracket(tournamentId: string) {
    const authStore = useAuthStore();
    const res = await fetch("/api/bracket/finalize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify({ tournamentId }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal memfinalisasi bagan.");
    if (tournament.value) tournament.value.status = "FINALIZED";
    return data;
  }

  async function assignMatchToCourt(bracketMatchId: string, courtMatchKey: string, format?: string) {
    const authStore = useAuthStore();
    const res = await fetch("/api/bracket/assign", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify({ bracketMatchId, courtMatchKey, format }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal mengirim ke meja.");
    if (tournament.value?.id) {
      await fetchActiveBracket(tournament.value.id);
    }
    return data;
  }

  async function finishMatch(courtMatchKey: string) {
    const authStore = useAuthStore();
    const res = await fetch("/api/bracket/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify({ courtMatchKey }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal menyelesaikan pertandingan.");
    if (tournament.value?.id) {
      await fetchActiveBracket(tournament.value.id);
    }
    return data;
  }

  return {
    tournament,
    tournamentsList,
    loading,
    initSocket,
    fetchActiveBracket,
    fetchTournaments,
    createBracket,
    shuffleBracket,
    finalizeBracket,
    assignMatchToCourt,
    finishMatch,
  };
});

