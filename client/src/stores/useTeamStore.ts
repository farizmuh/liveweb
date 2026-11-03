import { defineStore } from "pinia";
import { ref } from "vue";
import { useAuthStore } from "./useAuthStore";

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string | null;
  colorHex?: string | null;
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
    return data.team;
  }

  return {
    teams,
    loading,
    fetchTeams,
    createTeam,
  };
});

