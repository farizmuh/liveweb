<template>
  <div v-if="match" class="space-y-4">
    <!-- SWAP SIDE & QUICK ACTIONS ROW -->
    <div class="flex items-center justify-between gap-3">
      <button
        @click="() => matchStore.swapSide()"
        class="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-700/80 via-purple-700/80 to-red-700/80 hover:brightness-110 active:scale-95 transition flex items-center justify-center gap-2 text-sm font-bold shadow-lg border border-white/20 touch-press"
      >
        <ArrowLeftRight class="w-4 h-4" />
        <span>Swap Side (Tukar Posisi Tim)</span>
      </button>

      <button
        @click="showResetModal = true"
        class="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-red-950/80 border border-slate-700 hover:border-red-600 active:scale-95 transition flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-red-400 touch-press"
      >
        <RotateCcw class="w-4 h-4" />
        <span>Reset Skor</span>
      </button>
    </div>

    <!-- TWO TEAM SCORE CARDS (Mobile Responsive Grid) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      
      <!-- BLUE TEAM CARD (TEAM A) -->
      <div class="rounded-2xl p-4 bg-gradient-to-br from-blue-950/90 to-slate-900 border-2 border-blue-600/70 shadow-xl flex flex-col justify-between relative overflow-hidden">
        <div class="flex items-center justify-between pb-3 border-b border-blue-800/40">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-blue-600/40 border border-blue-400 flex items-center justify-center font-bold text-white text-xs">
              {{ match.teamA.shortName || 'BLU' }}
            </div>
            <div>
              <span class="text-[10px] font-bold uppercase tracking-widest text-blue-300">Tim Biru (Kiri)</span>
              <h3 class="text-base font-bold text-white truncate max-w-[160px]">{{ match.teamA.name }}</h3>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded bg-blue-900/80 text-blue-200 text-xs font-bold">
            Max: {{ winScore }}
          </span>
        </div>

        <!-- Score Large & Touch Controls -->
        <div class="my-4 flex items-center justify-around">
          <button
            @click="matchStore.changeScore('A', -1)"
            :disabled="match.teamA.score <= 0"
            class="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-600 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none active:scale-90 flex items-center justify-center text-xl font-black text-white shadow-md touch-press"
          >
            <Minus class="w-6 h-6 text-slate-300" />
          </button>

          <div class="flex flex-col items-center">
            <span class="text-6xl font-black font-display text-white tracking-wider drop-shadow-[0_2px_12px_rgba(59,130,246,0.6)]">
              {{ match.teamA.score }}
            </span>
            <span class="text-[11px] font-bold text-blue-300 tracking-wider">SKOR TIM A</span>
          </div>

          <button
            @click="matchStore.changeScore('A', 1)"
            :disabled="match.teamA.score >= winScore"
            class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 border-2 border-blue-300 hover:brightness-110 active:scale-90 flex items-center justify-center text-2xl font-black text-white shadow-blue-glow touch-press"
          >
            <Plus class="w-8 h-8 text-white stroke-[3]" />
          </button>
        </div>
      </div>

      <!-- RED TEAM CARD (TEAM B) -->
      <div class="rounded-2xl p-4 bg-gradient-to-br from-red-950/90 to-slate-900 border-2 border-red-600/70 shadow-xl flex flex-col justify-between relative overflow-hidden">
        <div class="flex items-center justify-between pb-3 border-b border-red-800/40">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-red-600/40 border border-red-400 flex items-center justify-center font-bold text-white text-xs">
              {{ match.teamB.shortName || 'RED' }}
            </div>
            <div>
              <span class="text-[10px] font-bold uppercase tracking-widest text-red-300">Tim Merah (Kanan)</span>
              <h3 class="text-base font-bold text-white truncate max-w-[160px]">{{ match.teamB.name }}</h3>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded bg-red-900/80 text-red-200 text-xs font-bold">
            Max: {{ winScore }}
          </span>
        </div>

        <!-- Score Large & Touch Controls -->
        <div class="my-4 flex items-center justify-around">
          <button
            @click="matchStore.changeScore('B', -1)"
            :disabled="match.teamB.score <= 0"
            class="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-600 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none active:scale-90 flex items-center justify-center text-xl font-black text-white shadow-md touch-press"
          >
            <Minus class="w-6 h-6 text-slate-300" />
          </button>

          <div class="flex flex-col items-center">
            <span class="text-6xl font-black font-display text-white tracking-wider drop-shadow-[0_2px_12px_rgba(239,68,68,0.6)]">
              {{ match.teamB.score }}
            </span>
            <span class="text-[11px] font-bold text-red-300 tracking-wider">SKOR TIM B</span>
          </div>

          <button
            @click="matchStore.changeScore('B', 1)"
            :disabled="match.teamB.score >= winScore"
            class="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 border-2 border-red-300 hover:brightness-110 active:scale-90 flex items-center justify-center text-2xl font-black text-white shadow-red-glow touch-press"
          >
            <Plus class="w-8 h-8 text-white stroke-[3]" />
          </button>
        </div>
      </div>

    </div>

    <!-- RESET SCORE CONFIRMATION MODAL -->
    <div
      v-if="showResetModal"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="w-full max-w-sm rounded-2xl bg-slate-900 border border-red-500/60 p-6 shadow-2xl text-center">
        <div class="w-12 h-12 rounded-full bg-red-900/50 text-red-400 mx-auto mb-3 flex items-center justify-center border border-red-500">
          <RotateCcw class="w-6 h-6" />
        </div>
        <h3 class="text-lg font-bold text-white mb-1">Reset Skor Pertandingan?</h3>
        <p class="text-xs text-slate-300 mb-6">
          Skor kedua tim akan dikembalikan ke 0-0 secara langsung di layar OBS dan database.
        </p>

        <div class="flex items-center gap-3">
          <button
            @click="showResetModal = false"
            class="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-700"
          >
            Batal
          </button>
          <button
            @click="confirmReset"
            class="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-500 shadow-red-glow"
          >
            Ya, Reset (0-0)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useMatchStore } from "../../stores/useMatchStore";
import { Plus, Minus, ArrowLeftRight, RotateCcw } from "lucide-vue-next";

const matchStore = useMatchStore();
const match = computed(() => matchStore.match);

const showResetModal = ref(false);

const winScore = computed(() => {
  if (!match.value) return 2;
  switch (match.value.format) {
    case "BO1":
      return 1;
    case "BO3":
      return 2;
    case "BO5":
      return 3;
    case "BO7":
      return 4;
    default:
      return 2;
  }
});

function confirmReset() {
  matchStore.resetScore();
  showResetModal.value = false;
}
</script>

