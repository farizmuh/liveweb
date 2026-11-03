<template>
  <Transition
    enter-active-class="transition duration-500 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-300 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div
      v-if="winner"
      class="absolute inset-0 z-30 rounded-xl bg-gradient-to-r from-amber-950 via-black to-amber-950 border-2 border-amber-400 shadow-gold-glow flex items-center justify-between px-6 overflow-hidden"
    >
      <!-- Light flare effect -->
      <div class="absolute inset-0 bg-gradient-to-r from-amber-400/10 via-amber-300/20 to-amber-400/10 pointer-events-none animate-pulse"></div>

      <!-- Left: Trophy & Format -->
      <div class="flex items-center gap-3 z-10">
        <div class="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 shadow-gold-glow">
          <Trophy class="w-7 h-7 text-amber-400 animate-bounce" />
        </div>
        <div class="flex flex-col">
          <span class="text-[10px] font-black tracking-[0.2em] text-amber-300 uppercase">
            CHAMPION • {{ format }}
          </span>
          <span class="text-xs font-bold text-white tracking-widest uppercase">
            MATCH WINNER
          </span>
        </div>
      </div>

      <!-- Center: Winning Team Large -->
      <div class="flex items-center gap-4 z-10">
        <div
          v-if="winner.logoUrl"
          class="w-13 h-13 rounded-lg p-1 bg-black/60 border-2 border-amber-400 flex items-center justify-center shadow-gold-glow"
        >
          <img :src="winner.logoUrl" :alt="winner.name" class="w-11 h-11 object-contain" />
        </div>

        <div class="text-center">
          <h1 class="text-3xl font-black uppercase tracking-wider text-white drop-shadow-[0_2px_12px_rgba(255,215,0,0.9)] font-display">
            {{ winner.name }}
          </h1>
          <span class="text-[11px] font-bold text-amber-300 tracking-[0.25em] uppercase">
            [{{ winner.shortName }}] &bull; VICTORIOUS
          </span>
        </div>
      </div>

      <!-- Right: Trophy -->
      <div class="flex items-center gap-2 z-10">
        <div class="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400 shadow-gold-glow">
          <Trophy class="w-7 h-7 text-amber-400 animate-bounce" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { watch } from "vue";
import { Trophy } from "lucide-vue-next";
import confetti from "canvas-confetti";
import type { TeamData } from "../../stores/useMatchStore";

const props = defineProps<{
  winner: TeamData | null;
  format: string;
}>();

watch(
  () => props.winner,
  (newWinner) => {
    if (newWinner) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.15 },
        colors: ["#ffd700", "#f59e0b", "#ffffff", "#3b82f6", "#ef4444"],
      });
    }
  }
);
</script>
