import { defineStore } from "pinia";
import { ref } from "vue";
import { useAuthStore } from "./useAuthStore";

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string | null;
  colorHex?: string | null;
  institution?: string | null;
}

export const useTeamStore = defineStore("teams", () => {
  const teams = ref<Team[]>([]);
  const loading = ref(false);

  async function fetchTeams() {
    loading.value = true;
    try {
      const res = await fetch("/api/teams");
      if (res.ok) {
        const data = await res.json();
        teams.value = data.teams || [];
      }
    } catch (err) {
      console.error("Gagal memuat preset tim:", err);
    } finally {
      loading.value = false;
    }
  }

  async function createTeam(formData: FormData) {
    const auth = useAuthStore();
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Gagal membuat tim baru");
    }
    const data = await res.json();
    teams.value.push(data.team);
    teams.value.sort((a, b) => a.name.localeCompare(b.name));
    return data.team;
  }

  async function updateTeam(id: string, formData: FormData) {
    const auth = useAuthStore();
    const res = await fetch(`/api/teams/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Gagal memperbarui data tim");
    }
    const data = await res.json();
    const idx = teams.value.findIndex((t) => t.id === id);
    if (idx !== -1) {
      teams.value[idx] = data.team;
      teams.value.sort((a, b) => a.name.localeCompare(b.name));
    }
    return data.team;
  }

  async function bulkCreateTeams(teamsList: Array<{ name: string; shortName?: string; institution?: string | null }>) {
    const auth = useAuthStore();
    const res = await fetch("/api/teams/bulk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({ teams: teamsList }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Gagal memproses bulk upload");
    }
    const data = await res.json();
    if (data.teams) {
      teams.value = data.teams;
    } else {
      await fetchTeams();
    }
    return data;
  }

  return {
    teams,
    loading,
    fetchTeams,
    createTeam,
    updateTeam,
    bulkCreateTeams,
  };
});

