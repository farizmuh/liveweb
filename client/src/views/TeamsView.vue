<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-12">
    <!-- Top Bar -->
    <header class="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <router-link to="/admin" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
            <ArrowLeft class="w-4 h-4" />
          </router-link>
          <div>
            <h1 class="text-sm font-bold text-white uppercase tracking-wider">Database Tim Preset</h1>
            <p class="text-[10px] text-slate-400">Kelola daftar tim dan logo untuk dropdown wasit</p>
          </div>
        </div>

        <button
          @click="showCreateModal = true"
          class="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 active:scale-95 transition shadow-gold-glow"
        >
          <Plus class="w-4 h-4" />
          <span>Tambah Tim</span>
        </button>
      </div>
    </header>

    <main class="max-w-4xl mx-auto w-full px-4 pt-4 flex-1 space-y-4">
      <!-- Loading indicator -->
      <div v-if="teamStore.loading" class="text-center py-8 text-xs text-slate-400">
        Memuat data tim...
      </div>

      <!-- Teams Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div
          v-for="team in teamStore.teams"
          :key="team.id"
          class="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-slate-950 border border-slate-700 p-1 flex items-center justify-center">
              <img
                v-if="team.logoUrl"
                :src="team.logoUrl"
                :alt="team.name"
                class="w-full h-full object-contain"
              />
              <span v-else class="text-xs font-black text-amber-400">
                {{ team.shortName.slice(0, 3) }}
              </span>
            </div>
            <div>
              <span class="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-800 text-amber-400">
                {{ team.shortName }}
              </span>
              <h3 class="text-xs font-bold text-white mt-0.5">{{ team.name }}</h3>
            </div>
          </div>

          <button
            @click="deleteTeam(team.id)"
            class="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
            title="Hapus Tim"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </main>

    <!-- CREATE TEAM MODAL -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <h3 class="text-sm font-bold text-white">Tambah Tim Baru</h3>
          <button @click="showCreateModal = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleCreateTeam" class="space-y-3.5">
          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Nama Tim Lengkap</label>
            <input
              v-model="newTeamName"
              type="text"
              required
              placeholder="cth: FNATIC ONIC"
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Singkatan / Tag (3-4 Huruf)</label>
            <input
              v-model="newTeamShort"
              type="text"
              required
              placeholder="cth: ONIC"
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white uppercase focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Upload File Logo (Opsional)</label>
            <input
              @change="onFileChange"
              type="file"
              accept="image/*"
              class="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-amber-400 hover:file:bg-slate-700"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Atau Masukkan URL Logo</label>
            <input
              v-model="newTeamLogoUrl"
              type="url"
              placeholder="https://... (jika tidak upload file)"
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div class="pt-3 flex gap-2">
            <button
              type="button"
              @click="showCreateModal = false"
              class="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-gold-glow"
            >
              {{ saving ? 'Menyimpan...' : 'Simpan Tim' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useTeamStore } from "../stores/useTeamStore";
import { useAuthStore } from "../stores/useAuthStore";
import { ArrowLeft, Plus, Trash2, X } from "lucide-vue-next";

const teamStore = useTeamStore();
const authStore = useAuthStore();

const showCreateModal = ref(false);
const newTeamName = ref("");
const newTeamShort = ref("");
const newTeamLogoUrl = ref("");
const selectedFile = ref<File | null>(null);
const saving = ref(false);

onMounted(() => {
  teamStore.fetchTeams();
});

function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (files && files[0]) {
    selectedFile.value = files[0];
  }
}

async function handleCreateTeam() {
  saving.value = true;
  try {
    const formData = new FormData();
    formData.append("name", newTeamName.value);
    formData.append("shortName", newTeamShort.value);
    if (newTeamLogoUrl.value) formData.append("logoUrl", newTeamLogoUrl.value);
    if (selectedFile.value) formData.append("logo", selectedFile.value);

    await teamStore.createTeam(formData);
    showCreateModal.value = false;
    newTeamName.value = "";
    newTeamShort.value = "";
    newTeamLogoUrl.value = "";
    selectedFile.value = null;
  } catch (err: any) {
    alert(err.message || "Gagal membuat tim.");
  } finally {
    saving.value = false;
  }
}

async function deleteTeam(id: string) {
  if (!confirm("Yakin ingin menghapus tim ini dari database?")) return;
  try {
    const res = await fetch(`/api/teams/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    if (res.ok) {
      teamStore.teams = teamStore.teams.filter((t) => t.id !== id);
    }
  } catch (err) {
    console.error("Gagal menghapus:", err);
  }
}
</script>

