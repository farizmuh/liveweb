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
            <h1 class="text-sm font-bold text-white uppercase tracking-wider">Manajemen Riwayat Pertandingan</h1>
            <p class="text-[10px] text-slate-400">Pilih pertandingan untuk ditampilkan langsung ke layar OBS</p>
          </div>
        </div>

        <button
          @click="showCreateModal = true"
          class="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 active:scale-95 transition shadow-gold-glow"
        >
          <Plus class="w-4 h-4" />
          <span>Buat Match Baru</span>
        </button>
      </div>
    </header>

    <main class="max-w-4xl mx-auto w-full px-4 pt-4 flex-1 space-y-3">
      <div v-if="loading" class="text-center py-8 text-xs text-slate-400">
        Memuat daftar pertandingan...
      </div>

      <div v-else-if="matches.length === 0" class="text-center py-12 text-slate-500 text-xs">
        Belum ada pertandingan tersimpan. Klik "Buat Match Baru" di atas.
      </div>

      <!-- Match Cards -->
      <div
        v-for="m in matches"
        :key="m.id"
        class="p-4 rounded-2xl bg-slate-900 border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        :class="[
          m.isActive
            ? 'border-amber-400/80 shadow-gold-glow bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30'
            : 'border-slate-800 hover:border-slate-700'
        ]"
      >
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span
              v-if="m.isActive"
              class="px-2 py-0.5 rounded-full bg-amber-500 text-black font-black text-[10px] uppercase tracking-wider shadow"
            >
              SEDANG AKTIF DI OBS
            </span>
            <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[10px]">
              {{ m.format }}
            </span>
            <span class="text-xs font-bold text-slate-400">
              {{ m.tournamentName }} &bull; {{ m.roundName }}
            </span>
          </div>

          <div class="flex items-center gap-3 pt-1">
            <span class="text-sm font-black text-blue-400">
              [{{ m.teamAShort }}] {{ m.teamAName }}
            </span>
            <span class="px-2 py-0.5 rounded bg-black/60 font-display text-base font-black text-amber-300">
              {{ m.scoreA }} - {{ m.scoreB }}
            </span>
            <span class="text-sm font-black text-red-400">
              [{{ m.teamBShort }}] {{ m.teamBName }}
            </span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2">
          <button
            v-if="!m.isActive"
            @click="activateMatch(m.id)"
            class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition"
          >
            <Radio class="w-3.5 h-3.5 text-amber-400" />
            <span>Tampilkan di OBS</span>
          </button>

          <button
            v-if="!m.isActive"
            @click="deleteMatch(m.id)"
            class="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
            title="Hapus Match"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>
    </main>

    <!-- CREATE MATCH MODAL -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <h3 class="text-sm font-bold text-white">Buat Pertandingan Baru</h3>
          <button @click="showCreateModal = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleCreateMatch" class="space-y-3.5">
          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Turnamen</label>
            <input
              v-model="newTourney"
              type="text"
              required
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Babak (Round)</label>
            <input
              v-model="newRound"
              type="text"
              required
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Format</label>
            <select
              v-model="newFormat"
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
            >
              <option value="BO1">BO1 (Best of 1)</option>
              <option value="BO3">BO3 (Best of 3)</option>
              <option value="BO5">BO5 (Best of 5)</option>
              <option value="BO7">BO7 (Best of 7)</option>
            </select>
          </div>

          <label class="flex items-center gap-2 pt-2 cursor-pointer">
            <input type="checkbox" v-model="setAsActiveNow" class="rounded bg-slate-950 border-slate-700 text-amber-500" />
            <span class="text-xs font-bold text-amber-400">Langsung jadikan aktif di OBS</span>
          </label>

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
              class="flex-1 py-2.5 rounded-xl bg-amber-500 text-black font-bold text-xs shadow-gold-glow"
            >
              Buat Match
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "../stores/useAuthStore";
import { useMatchStore } from "../stores/useMatchStore";
import { ArrowLeft, Plus, Radio, Trash2, X } from "lucide-vue-next";

const authStore = useAuthStore();
const matchStore = useMatchStore();

const matches = ref<any[]>([]);
const loading = ref(false);
const showCreateModal = ref(false);

const newTourney = ref("MPL INDONESIA S14");
const newRound = ref("REGULAR SEASON");
const newFormat = ref("BO3");
const setAsActiveNow = ref(true);

async function fetchMatches() {
  loading.value = true;
  try {
    const res = await fetch("/api/matches");
    if (res.ok) {
      const data = await res.json();
      matches.value = data.matches || [];
    }
  } catch (err) {
    console.error("Gagal memuat matches:", err);
  } finally {
    loading.value = false;
  }
}

async function activateMatch(id: string) {
  try {
    const res = await fetch(`/api/matches/${id}/active`, {
      method: "POST",
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    if (res.ok) {
      await fetchMatches();
    }
  } catch (err) {
    console.error(err);
  }
}

async function handleCreateMatch() {
  try {
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify({
        tournamentName: newTourney.value,
        roundName: newRound.value,
        format: newFormat.value,
        setAsActive: setAsActiveNow.value,
      }),
    });
    if (res.ok) {
      showCreateModal.value = false;
      await fetchMatches();
    }
  } catch (err) {
    console.error(err);
  }
}

async function deleteMatch(id: string) {
  if (!confirm("Hapus pertandingan ini dari database?")) return;
  try {
    const res = await fetch(`/api/matches/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    if (res.ok) {
      matches.value = matches.value.filter((m) => m.id !== id);
    }
  } catch (err) {
    console.error(err);
  }
}

onMounted(() => {
  fetchMatches();
});
</script>

