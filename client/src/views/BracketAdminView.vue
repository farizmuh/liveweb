<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-12 selection:bg-amber-500 selection:text-black">
    <!-- TOP NAVIGATION BAR -->
    <header class="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-lg">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <!-- Brand & Title -->
        <div class="flex items-center gap-3">
          <router-link to="/admin" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300">
            <ArrowLeft class="w-4 h-4" />
          </router-link>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-sm font-extrabold uppercase tracking-wider text-white">Manajemen Bagan Turnamen</h1>
              <span
                v-if="tournament"
                class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"
                :class="statusBadgeClass(tournament.status)"
              >
                {{ tournament.status }}
              </span>
            </div>
            <p class="text-[10px] text-slate-400 font-semibold">
              {{ tournament?.name || 'Belum ada turnamen aktif' }} &bull; {{ tournament?.type === 'DOUBLE_ELIMINATION' ? 'Double Elimination' : 'Single Elimination' }}
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center gap-2">
          <!-- Copy OBS Link Terpusat Otomatis -->
          <button
            @click="copyGlobalOverlayUrl"
            class="py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black text-xs font-black flex items-center gap-1.5 shadow-gold-glow active:scale-95 transition"
            title="Salin 1 Link OBS Terpusat Otomatis (http://localhost:3000/overlay/bracket) yang otomatis beralih fase"
          >
            <Copy class="w-3.5 h-3.5" />
            <span>Salin Link OBS Bagan (Otomatis)</span>
          </button>

          <!-- New Bracket Button -->
          <button
            @click="showCreateModal = true"
            class="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition"
          >
            <Plus class="w-4 h-4 text-amber-400" />
            <span>Buat Bagan Baru</span>
          </button>
        </div>
      </div>
    </header>

    <!-- TOAST NOTIFICATION -->
    <div
      v-if="toastMessage"
      class="fixed top-16 inset-x-0 mx-auto w-max z-50 px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs shadow-xl animate-bounce"
    >
      {{ toastMessage }}
    </div>

    <!-- MAIN BODY -->
    <main class="max-w-7xl mx-auto w-full px-4 pt-4 space-y-4 flex-1">
      
      <!-- SUB-NAV BAR (NAVIGATION TABS) -->
      <div class="flex items-center gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold">
        <router-link to="/admin" class="flex-1 py-2 text-center rounded-lg text-slate-300 hover:text-white">
          Kontrol Meja
        </router-link>
        <router-link to="/bracket" class="flex-1 py-2 text-center rounded-lg bg-amber-500 text-black shadow-sm">
          Bagan Turnamen
        </router-link>
        <router-link to="/teams" class="flex-1 py-2 text-center rounded-lg text-slate-300 hover:text-white">
          Database Tim
        </router-link>
      </div>

      <!-- BRACKET CONTROLS BAR (SHUFFLE & FINALIZE) -->
      <div v-if="tournament" class="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div class="flex items-center gap-2 text-xs">
          <span class="text-slate-400 font-semibold">Status Bagan:</span>
          <b class="text-amber-300 uppercase tracking-wider">{{ tournament.status }}</b>
          <span class="text-slate-600">&bull;</span>
          <span class="text-slate-400">Total Match: <b>{{ tournament.matches.length }}</b></span>
        </div>

        <div class="flex items-center gap-2">
          <!-- ROULETTE CONTINUOUS SHUFFLE BUTTONS (Only when DRAFT) -->
          <div v-if="tournament.status === 'DRAFT'" class="flex items-center gap-2">
            <!-- Button 1: Start Rolling -->
            <button
              v-if="!isRolling"
              @click="startRoulette"
              :disabled="actionLoading"
              class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition shadow-sm"
              title="Mulai pengacakan rolet berkelanjutan dengan suara dramatis"
            >
              <Shuffle class="w-3.5 h-3.5 text-amber-400" />
              <span>Acak Tim (Rolet)</span>
            </button>

            <!-- Button 2: Stop & Lock In (Pulsing Red) -->
            <button
              v-else
              @click="stopRoulette"
              :disabled="isStopping"
              class="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white border border-red-400 text-xs font-black flex items-center gap-2 shadow-red-glow animate-pulse active:scale-95 transition"
              title="Hentikan rolet dan kunci susunan tim"
            >
              <Square class="w-3 h-3 fill-current" />
              <span>{{ isStopping ? 'Mengunci Hasil Rolet...' : '🛑 Berhenti & Kunci' }}</span>
            </button>
          </div>

          <!-- FINALIZE BUTTON -->
          <button
            v-if="tournament.status === 'DRAFT' && !isRolling"
            @click="handleFinalize"
            :disabled="actionLoading"
            class="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 active:scale-95 transition shadow"
          >
            <CheckCircle2 class="w-3.5 h-3.5" />
            <span>Kunci & Finalisasi Bagan</span>
          </button>

          <span v-else class="text-xs font-bold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 class="w-4 h-4" />
            <span>Bagan Terkunci (Siap Ditandingkan)</span>
          </span>
        </div>
      </div>

      <!-- NO TOURNAMENT ALERT -->
      <div v-if="!tournament" class="text-center py-16 p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <Trophy class="w-12 h-12 text-amber-400/50 mx-auto" />
        <h3 class="text-lg font-bold text-white">Belum Ada Bagan Turnamen</h3>
        <p class="text-xs text-slate-400 max-w-sm mx-auto">
          Klik tombol "Buat Bagan Baru" di pojok kanan atas untuk memilih tim dan membuat bagan turnamen otomatis.
        </p>
      </div>

      <!-- BRACKET ROUNDS VIEW -->
      <div v-else class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-bold text-slate-200 flex items-center gap-2">
            <GitBranch class="w-4 h-4 text-amber-400" />
            <span>Bagan Pertandingan (Klik 'Kirim ke Meja' untuk Menandingkan)</span>
          </h2>
          <span class="text-xs text-slate-400">Pemenang Otomatis Maju Saat Match Selesai</span>
        </div>

        <!-- ROUND COLUMNS CONTAINER -->
        <div class="flex items-start gap-4 overflow-x-auto pb-6">
          <div
            v-for="roundObj in rounds"
            :key="roundObj.round"
            class="min-w-[280px] max-w-[320px] shrink-0 space-y-3"
          >
            <!-- Round Title Header -->
            <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center shadow">
              <h3 class="text-xs font-black uppercase text-amber-300 tracking-wider">
                {{ roundObj.matches.length > 1 && roundObj.round === maxRound ? 'FINALS & JUARA 3' : roundObj.name }}
              </h3>
              <span class="text-[10px] text-slate-400 font-semibold">{{ roundObj.matches.length }} Pertandingan</span>
            </div>

            <!-- Match Nodes -->
            <div class="space-y-3">
              <div
                v-for="m in roundObj.matches"
                :key="m.id"
                class="rounded-2xl p-3.5 bg-slate-900 border transition-all shadow-xl space-y-3 relative overflow-hidden"
                :class="[
                  isRolling && (roundObj.round === 1 || m.teamAId || m.teamBId)
                    ? 'border-2 border-amber-400 shadow-gold-glow animate-pulse'
                    : m.status === 'LIVE'
                    ? 'border-2 border-amber-400 shadow-gold-glow'
                    : 'border-slate-800'
                ]"
              >
                <!-- Match Status Banner -->
                <div class="flex items-center justify-between text-[11px] pb-1 border-b border-slate-800">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span v-if="m.roundName.toLowerCase().includes('juara 3') || m.roundName.toLowerCase().includes('bronze')" class="px-1.5 py-0.5 rounded bg-orange-600/30 text-orange-400 border border-orange-500/50 font-black text-[9px] uppercase tracking-wider shrink-0">
                      🥉 Juara 3
                    </span>
                    <span v-else-if="m.roundName.toLowerCase().includes('grand final')" class="px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-400/50 font-black text-[9px] uppercase tracking-wider shrink-0">
                      👑 Grand Final
                    </span>
                    <span class="font-bold text-slate-400 uppercase truncate">Match #{{ m.matchOrder }}</span>
                  </div>
                  <span
                    class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0"
                    :class="nodeStatusBadgeClass(m.status)"
                  >
                    {{ isRolling && (roundObj.round === 1 || m.teamAId || m.teamBId) ? 'ROLLING...' : m.status }}
                  </span>
                </div>

                <!-- Teams & Live Scores -->
                <div class="space-y-1.5">
                  <!-- Team A -->
                  <div
                    class="flex items-center justify-between p-2 rounded-xl border transition"
                    :class="[
                      m.winnerTeam === 'A' ? 'bg-amber-500/20 border-amber-400/60' : 'bg-slate-950/70 border-slate-800'
                    ]"
                  >
                    <div class="flex items-center gap-2 overflow-hidden">
                      <div class="w-6 h-6 rounded bg-black/60 p-0.5 border border-slate-700 flex items-center justify-center shrink-0">
                        <img v-if="getNodeTeam(m, 'A').logoUrl" :src="getNodeTeam(m, 'A').logoUrl" class="w-full h-full object-contain" />
                        <span v-else class="text-[9px] font-bold text-amber-400">{{ getNodeTeam(m, 'A').shortName?.slice(0, 3) || '?' }}</span>
                      </div>
                      <span class="text-xs font-bold text-white truncate max-w-[140px]">
                        {{ getNodeTeam(m, 'A').name || (m.isBye ? 'BYE' : 'TBD (Menunggu)') }}
                      </span>
                    </div>
                    <span class="font-display text-lg font-black" :class="m.winnerTeam === 'A' ? 'text-amber-300' : 'text-slate-300'">
                      {{ m.scoreA }}
                    </span>
                  </div>

                  <!-- Team B -->
                  <div
                    class="flex items-center justify-between p-2 rounded-xl border transition"
                    :class="[
                      m.winnerTeam === 'B' ? 'bg-amber-500/20 border-amber-400/60' : 'bg-slate-950/70 border-slate-800'
                    ]"
                  >
                    <div class="flex items-center gap-2 overflow-hidden">
                      <div class="w-6 h-6 rounded bg-black/60 p-0.5 border border-slate-700 flex items-center justify-center shrink-0">
                        <img v-if="getNodeTeam(m, 'B').logoUrl" :src="getNodeTeam(m, 'B').logoUrl" class="w-full h-full object-contain" />
                        <span v-else class="text-[9px] font-bold text-amber-400">{{ getNodeTeam(m, 'B').shortName?.slice(0, 3) || '?' }}</span>
                      </div>
                      <span class="text-xs font-bold text-white truncate max-w-[140px]">
                        {{ getNodeTeam(m, 'B').name || (m.isBye ? 'BYE' : 'TBD (Menunggu)') }}
                      </span>
                    </div>
                    <span class="font-display text-lg font-black" :class="m.winnerTeam === 'B' ? 'text-amber-300' : 'text-slate-300'">
                      {{ m.scoreB }}
                    </span>
                  </div>
                </div>

                <!-- ACTIONS PER NODE -->
                <!-- 1. Jika Status READY: Bisa di-assign ke meja -->
                <div v-if="m.status === 'READY'" class="pt-1 flex items-center gap-1.5">
                  <!-- Pilihan Format BO (BO1, BO3, BO5, BO7) -->
                  <select
                    :value="selectedFormat[m.id] || tournament.format || 'BO3'"
                    @input="selectedFormat[m.id] = ($event.target as HTMLSelectElement).value"
                    class="w-20 px-2 py-1.5 rounded-lg bg-slate-950 border border-amber-500/50 text-amber-300 font-black text-xs focus:outline-none shrink-0"
                    title="Pilih Format BO untuk match ini"
                  >
                    <option value="BO1">BO1</option>
                    <option value="BO3">BO3</option>
                    <option value="BO5">BO5</option>
                    <option value="BO7">BO7</option>
                  </select>

                  <!-- Pilihan Meja -->
                  <select
                    v-model="selectedCourt[m.id]"
                    class="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-semibold text-white focus:outline-none min-w-0"
                  >
                    <option value="">-- Pilih Meja --</option>
                    <option
                      v-for="c in matchStore.allMatches"
                      :key="c.matchKey"
                      :value="c.matchKey"
                      :disabled="isCourtBusy(c.matchKey)"
                      :class="isCourtBusy(c.matchKey) ? 'text-slate-500 bg-slate-900' : 'text-white'"
                    >
                      {{ c.courtName }} {{ isCourtBusy(c.matchKey) ? '🔴 (SEDANG AKTIF)' : '🟢 (Tersedia)' }}
                    </option>
                  </select>

                  <button
                    @click="handleAssignToCourt(m.id)"
                    :disabled="!selectedCourt[m.id] || isCourtBusy(selectedCourt[m.id])"
                    class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black text-xs disabled:opacity-30 active:scale-95 transition shrink-0 shadow-sm"
                  >
                    Kirim
                  </button>
                </div>

                <!-- 2. Jika Status LIVE: Sedang tanding di meja tertentu -->
                <div v-else-if="m.status === 'LIVE'" class="pt-1 space-y-2">
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-bold text-emerald-400 flex items-center gap-1.5 truncate">
                      <Radio class="w-3.5 h-3.5 animate-pulse text-red-500 shrink-0" />
                      <span class="truncate">Live di {{ m.assignedCourt }}</span>
                    </span>

                    <!-- Tombol Batal Kirim / Tarik dari Meja -->
                    <button
                      @click="handleUnassignFromCourt(m.id)"
                      class="px-2 py-0.5 rounded bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/50 text-[10px] font-bold flex items-center gap-1 active:scale-95 transition shrink-0"
                      title="Batalkan penugasan ke meja ini dan kembalikan match ke status Siap (Ready)"
                    >
                      <RotateCcw class="w-3 h-3" />
                      <span>Tarik dari Meja</span>
                    </button>
                  </div>

                  <!-- TOMBOL SELESAIKAN MATCH -->
                  <button
                    @click="handleFinishMatch(m.courtMatchKey || '', m.id)"
                    class="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow active:scale-95 transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle class="w-4 h-4" />
                    <span>Selesaikan Match Ini</span>
                  </button>
                </div>

                <!-- 3. Jika Status COMPLETED: Pemenang sudah lolos -->
                <div v-else-if="m.status === 'COMPLETED'" class="text-center pt-1 text-[11px] font-bold text-emerald-400">
                  <span v-if="m.isBye">Lolos Otomatis (BYE)</span>
                  <span v-else>Pemenang Lolos ke Babak Berikutnya</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- MODAL BUAT BAGAN BARU -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4 shrink-0">
          <h3 class="text-base font-bold text-white flex items-center gap-2">
            <Trophy class="w-5 h-5 text-amber-400" />
            <span>Buat Bagan Turnamen Baru</span>
          </h3>
          <button @click="showCreateModal = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleCreateBracket" class="space-y-4 overflow-y-auto flex-1 pr-1">
          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Nama Turnamen</label>
            <input
              v-model="newTourneyName"
              type="text"
              required
              placeholder="cth: MPL COMMUNITY CUP SEASON 1"
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Tipe Bagan</label>
              <select
                v-model="newTourneyType"
                class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
              >
                <option value="SINGLE_ELIMINATION">Single Elimination (Sistem Gugur)</option>
                <option value="DOUBLE_ELIMINATION">Double Elimination (Upper & Lower)</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Format Pertandingan</label>
              <select
                v-model="newTourneyFormat"
                class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
              >
                <option value="BO1">BO1 (Best of 1)</option>
                <option value="BO3">BO3 (Best of 3)</option>
                <option value="BO5">BO5 (Best of 5)</option>
              </select>
            </div>
          </div>

          <!-- CHECKLIST TIM DARI PRESET -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs font-bold text-slate-300 uppercase">
                Pilih Tim Peserta (Terpilih: {{ selectedTeamIds.length }} Tim)
              </label>
              <button
                type="button"
                @click="selectAllTeams"
                class="text-[11px] font-bold text-amber-400 hover:underline"
              >
                Pilih Semua
              </button>
            </div>

            <div class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800">
              <label
                v-for="t in teamStore.teams"
                :key="t.id"
                class="flex items-center gap-2 p-2 rounded-lg bg-slate-900 hover:bg-slate-850 cursor-pointer border border-transparent hover:border-slate-700 text-xs"
              >
                <input
                  type="checkbox"
                  :value="t.id"
                  v-model="selectedTeamIds"
                  class="rounded bg-slate-950 border-slate-700 text-amber-500 shrink-0"
                />
                <span class="font-black text-amber-300 shrink-0">[{{ t.shortName }}]</span>
                <div class="min-w-0 flex-1">
                  <span class="truncate text-white block font-medium">{{ t.name }}</span>
                  <span v-if="t.institution" class="text-[10px] text-cyan-300 truncate block">{{ t.institution }}</span>
                </div>
              </label>
            </div>
            <p class="text-[11px] text-slate-400 mt-1">
              *Jika jumlah tim ganjil/bukan pangkat 2 (misal 6 atau 10 tim), sistem otomatis membuatkan slot BYE.
            </p>
          </div>

          <div class="pt-3 flex gap-2 shrink-0">
            <button
              type="button"
              @click="showCreateModal = false"
              class="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="selectedTeamIds.length < 2 || actionLoading"
              class="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-gold-glow disabled:opacity-40"
            >
              {{ actionLoading ? 'Membuat Bagan...' : 'Generate Bagan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useBracketStore, type BracketMatchNode } from "../stores/useBracketStore";
import { useTeamStore } from "../stores/useTeamStore";
import { useMatchStore } from "../stores/useMatchStore";
import {
  ArrowLeft,
  Plus,
  Trophy,
  Copy,
  Shuffle,
  CheckCircle2,
  CheckCircle,
  GitBranch,
  Radio,
  X,
  Square,
  Swords,
  RotateCcw,
} from "lucide-vue-next";

import { bracketAudioFX } from "../utils/bracketAudioFX";

const bracketStore = useBracketStore();
const teamStore = useTeamStore();
const matchStore = useMatchStore();

const tournament = computed(() => bracketStore.tournament);
const toastMessage = ref("");
const actionLoading = ref(false);

const showCreateModal = ref(false);
const newTourneyName = ref("MPL COMMUNITY CUP S1");
const newTourneyType = ref<"SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION">("SINGLE_ELIMINATION");
const newTourneyFormat = ref("BO3");
const selectedTeamIds = ref<string[]>([]);
const selectedCourt = ref<Record<string, string>>({});
const selectedFormat = ref<Record<string, string>>({});

// Group matches by round for bracket columns
const rounds = computed(() => {
  if (!tournament.value?.matches) return [];

  const map = new Map<number, { round: number; name: string; matches: BracketMatchNode[] }>();

  for (const m of tournament.value.matches) {
    if (!map.has(m.round)) {
      map.set(m.round, {
        round: m.round,
        name: m.roundName,
        matches: [],
      });
    }
    map.get(m.round)!.matches.push(m);
  }

  return Array.from(map.values()).sort((a, b) => a.round - b.round);
});

const maxRound = computed(() => {
  if (!tournament.value?.matches || tournament.value.matches.length === 0) return 0;
  return Math.max(...tournament.value.matches.map((m) => m.round));
});

onMounted(async () => {
  await bracketStore.fetchActiveBracket();
  await teamStore.fetchTeams();
  matchStore.joinSuperadminRoom();
  bracketStore.initSocket();

  // Pre-select all teams
  if (teamStore.teams.length > 0) {
    selectedTeamIds.value = teamStore.teams.map((t) => t.id);
  }
});

function selectAllTeams() {
  selectedTeamIds.value = teamStore.teams.map((t) => t.id);
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "DRAFT":
      return "bg-amber-500/20 text-amber-300 border border-amber-400/50";
    case "FINALIZED":
      return "bg-blue-600/30 text-blue-300 border border-blue-400/50";
    case "IN_PROGRESS":
      return "bg-emerald-600/30 text-emerald-300 border border-emerald-400/50";
    default:
      return "bg-slate-800 text-slate-300";
  }
}

function nodeStatusBadgeClass(status: string) {
  switch (status) {
    case "READY":
      return "bg-blue-600/80 text-white";
    case "LIVE":
      return "bg-red-600 text-white animate-pulse shadow-red-glow";
    case "COMPLETED":
      return "bg-emerald-600/80 text-white";
    default:
      return "bg-slate-800 text-slate-400";
  }
}

async function handleCreateBracket() {
  if (selectedTeamIds.value.length < 2) return;
  actionLoading.value = true;
  try {
    await bracketStore.createBracket({
      name: newTourneyName.value,
      type: newTourneyType.value,
      format: newTourneyFormat.value,
      teamIds: selectedTeamIds.value,
    });
    showCreateModal.value = false;
    toastMessage.value = "Bagan turnamen berhasil dibuat!";
    setTimeout(() => (toastMessage.value = ""), 2500);
  } catch (err: any) {
    alert(err.message || "Gagal membuat bagan.");
  } finally {
    actionLoading.value = false;
  }
}

// ==========================================
// ROULETTE CONTINUOUS SHUFFLE & DECELERATION
// ==========================================
const isRolling = ref(false);
const isStopping = ref(false);
let rollTimer: any = null;
const rollingSlots = ref<Record<string, { teamA: any; teamB: any }>>({});

function getNodeTeam(m: BracketMatchNode, slot: "A" | "B") {
  if (isRolling.value && rollingSlots.value[m.id]) {
    const rTeam = slot === "A" ? rollingSlots.value[m.id].teamA : rollingSlots.value[m.id].teamB;
    if (rTeam) return rTeam;
  }
  return {
    logoUrl: slot === "A" ? m.teamALogo : m.teamBLogo,
    shortName: slot === "A" ? m.teamAShort : m.teamBShort,
    name: slot === "A" ? m.teamAName : m.teamBName,
  };
}

function startRoulette() {
  if (!tournament.value || tournament.value.status !== "DRAFT") return;

  // Kumpulkan semua match awal yang memiliki tim (Round 1 dan Round 2)
  const initialMatches = tournament.value.matches.filter(
    (m) => m.round === 1 || (m.round === 2 && (m.teamAId || m.teamBId))
  );

  const allTeams: any[] = [];
  const teamIdSet = new Set<string>();

  for (const m of tournament.value.matches) {
    if (m.teamAId && !teamIdSet.has(m.teamAId)) {
      teamIdSet.add(m.teamAId);
      allTeams.push({
        id: m.teamAId,
        name: m.teamAName,
        shortName: m.teamAShort,
        logoUrl: m.teamALogo,
      });
    }
    if (m.teamBId && !teamIdSet.has(m.teamBId)) {
      teamIdSet.add(m.teamBId);
      allTeams.push({
        id: m.teamBId,
        name: m.teamBName,
        shortName: m.teamBShort,
        logoUrl: m.teamBLogo,
      });
    }
  }

  if (allTeams.length < 2) return;

  isRolling.value = true;
  isStopping.value = false;

  // Broadcast ke OBS overlay agar ikut mengacak secara real-time
  bracketStore.emitRouletteStart();

  const cycleShuffle = () => {
    const shuffled = [...allTeams].sort(() => Math.random() - 0.5);
    const newSlots: Record<string, { teamA: any; teamB: any }> = {};
    let cursor = 0;

    initialMatches.forEach((m) => {
      newSlots[m.id] = {
        teamA: m.teamAId ? (shuffled[cursor++] || null) : null,
        teamB: m.teamBId ? (shuffled[cursor++] || null) : null,
      };
    });

    rollingSlots.value = newSlots;
    bracketAudioFX.playTick(650 + Math.random() * 250);
  };

  cycleShuffle();
  rollTimer = setInterval(cycleShuffle, 75);
}

async function stopRoulette() {
  if (!isRolling.value || isStopping.value) return;
  isStopping.value = true;
  clearInterval(rollTimer);

  // Broadcast ke OBS overlay agar ikut melambat & mengunci
  bracketStore.emitRouletteStop();

  const initialMatches = tournament.value?.matches.filter(
    (m) => m.round === 1 || (m.round === 2 && (m.teamAId || m.teamBId))
  ) || [];

  const allTeams: any[] = [];
  const teamIdSet = new Set<string>();

  for (const m of tournament.value?.matches || []) {
    if (m.teamAId && !teamIdSet.has(m.teamAId)) {
      teamIdSet.add(m.teamAId);
      allTeams.push({ id: m.teamAId, name: m.teamAName, shortName: m.teamAShort, logoUrl: m.teamALogo });
    }
    if (m.teamBId && !teamIdSet.has(m.teamBId)) {
      teamIdSet.add(m.teamBId);
      allTeams.push({ id: m.teamBId, name: m.teamBName, shortName: m.teamBShort, logoUrl: m.teamBLogo });
    }
  }

  // Efek Deselerasi Halus (Putaran melambat bertahap ~1.5 detik)
  const decelSteps = [100, 140, 200, 280, 400, 580];
  for (let i = 0; i < decelSteps.length; i++) {
    await new Promise((resolve) => setTimeout(resolve, decelSteps[i]));
    const shuffled = [...allTeams].sort(() => Math.random() - 0.5);
    const newSlots: Record<string, { teamA: any; teamB: any }> = {};
    let cursor = 0;

    initialMatches.forEach((m) => {
      newSlots[m.id] = {
        teamA: m.teamAId ? (shuffled[cursor++] || null) : null,
        teamB: m.teamBId ? (shuffled[cursor++] || null) : null,
      };
    });

    rollingSlots.value = newSlots;
    bracketAudioFX.playTick(600 - i * 65);
  }

  // Kunci final di backend
  try {
    if (tournament.value) {
      await bracketStore.shuffleBracket(tournament.value.id);
    }
    bracketAudioFX.playLockChime();
    toastMessage.value = "🎉 Susunan Tim Resmi Terkunci!";
    setTimeout(() => (toastMessage.value = ""), 3000);
  } catch (err: any) {
    alert(err.message || "Gagal mengacak tim.");
  } finally {
    rollingSlots.value = {};
    isRolling.value = false;
    isStopping.value = false;
  }
}

async function handleShuffle() {
  startRoulette();
}

async function handleFinalize() {
  if (!tournament.value) return;
  if (!confirm("Kunci bagan ini? Setelah difinalisasi, posisi tim tidak dapat diacak lagi.")) return;
  actionLoading.value = true;
  try {
    await bracketStore.finalizeBracket(tournament.value.id);
    toastMessage.value = "Bagan turnamen resmi difinalisasi (Terkunci)!";
    setTimeout(() => (toastMessage.value = ""), 2500);
  } catch (err: any) {
    alert(err.message || "Gagal memfinalisasi bagan.");
  } finally {
    actionLoading.value = false;
  }
}

async function handleAssignToCourt(bracketMatchId: string) {
  const courtKey = selectedCourt.value[bracketMatchId];
  if (!courtKey) return;
  const format = selectedFormat.value[bracketMatchId] || tournament.value?.format || "BO3";
  try {
    await bracketStore.assignMatchToCourt(bracketMatchId, courtKey, format);
    toastMessage.value = `Pertandingan (${format}) berhasil dikirim ke meja siaran!`;
    setTimeout(() => (toastMessage.value = ""), 2500);
  } catch (err: any) {
    alert(err.message || "Gagal mengirim ke meja.");
  }
}

function isCourtBusy(courtMatchKey: string): boolean {
  if (!courtMatchKey) return false;

  // Jika meja secara eksplisit berstatus STANDBY (isWaitingForNext === true), maka meja 100% KOSONG
  const court = matchStore.allMatches.find((c) => c.matchKey === courtMatchKey);
  if (court && court.isWaitingForNext) {
    return false;
  }

  // Cek apakah status meja di memory/store sedang aktif bertanding (bukan standby)
  if (court && !court.isWaitingForNext && court.bracketMatchId) {
    return true;
  }

  // Cek apakah ada pertandingan di bagan yang sedang LIVE di meja ini
  const hasLiveInTournament = tournament.value?.matches.some(
    (m) => m.status === "LIVE" && m.courtMatchKey === courtMatchKey
  );
  if (hasLiveInTournament) return true;

  return false;
}

async function handleUnassignFromCourt(bracketMatchId: string) {
  if (!confirm("Tarik pertandingan ini kembali dari meja? Status match akan kembali menjadi Siap (Ready) dan meja akan kembali tersedia.")) return;
  try {
    const res = await bracketStore.unassignMatchFromCourt(bracketMatchId);
    toastMessage.value = res.message || "Pertandingan berhasil ditarik dari meja!";
    setTimeout(() => (toastMessage.value = ""), 3000);
  } catch (err: any) {
    alert(err.message || "Gagal menarik pertandingan dari meja.");
  }
}

async function handleFinishMatch(courtMatchKey: string, bracketMatchId?: string) {
  if (!confirm("Selesaikan pertandingan ini? Pemenang akan otomatis maju di bagan, dan meja akan otomatis dikosongkan ke status menunggu.")) return;
  try {
    const res = await bracketStore.finishMatch(courtMatchKey, bracketMatchId);
    toastMessage.value = res.message || "Pertandingan selesai!";
    setTimeout(() => (toastMessage.value = ""), 3000);
  } catch (err: any) {
    alert(err.message || "Gagal menyelesaikan pertandingan.");
  }
}

function copyGlobalOverlayUrl() {
  const url = `${window.location.origin}/overlay/bracket`;
  navigator.clipboard.writeText(url);
  toastMessage.value = "Link OBS Bagan Terpusat (http://.../overlay/bracket) berhasil disalin!";
  setTimeout(() => (toastMessage.value = ""), 2500);
}
</script>

