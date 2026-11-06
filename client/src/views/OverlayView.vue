<template>
  <!-- OVERLAY CONTAINER -->
  <div class="w-[1080px] min-h-min p-1 relative overflow-visible bg-transparent select-none mx-auto flex flex-col items-center">
    
    <!-- 1. JIKA TIDAK ADA KEY DI URL: TAMPILKAN PANDUAN TRANSPARAN -->
    <div
      v-if="!currentKey"
      class="w-full p-4 rounded-2xl bg-black/85 border border-amber-500/70 text-center shadow-2xl backdrop-blur-sm"
    >
      <div class="flex items-center justify-center gap-2 text-amber-400 font-bold text-sm uppercase tracking-wider mb-2">
        <KeyRound class="w-5 h-5 animate-pulse" />
        <span>KUNCI PERTANDINGAN DIPERLUKAN (STREAM KEY)</span>
      </div>
      <p class="text-xs text-slate-300 max-w-lg mx-auto mb-3">
        Masukkan parameter key pertandingan pada URL Browser Source OBS untuk menghubungkan overlay ini ke komputer/meja yang tepat:
      </p>
      <div class="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-amber-300 text-xs inline-block">
        {{ baseUrl }}/overlay?key=<b>&lt;MATCH-KEY&gt;</b>
      </div>
      <div class="mt-3 text-[11px] text-slate-400">
        Contoh: <span class="text-white font-mono">/overlay?key=match-c1-8f3a9b</span> (Court 1)
      </div>
    </div>

    <!-- 2. JIKA KEY ADA TAPI DATA SEDANG DIMUAT / TIDAK DITEMUKAN -->
    <div
      v-else-if="!match"
      class="px-6 py-3 rounded-xl bg-black/80 border border-slate-700 text-xs text-amber-400 font-bold flex items-center gap-2 animate-pulse"
    >
      <span>Menghubungkan ke Match [{{ currentKey }}]...</span>
    </div>

    <!-- 3. JIKA SEDANG MENUNGGU MATCH BERIKUTNYA DARI BAGAN TURNAMEN -->
    <div
      v-else-if="match.isWaitingForNext"
      class="w-full h-24 metallic-card rounded-2xl border-2 border-amber-400 shadow-gold-glow flex items-center justify-between px-8 overflow-hidden relative"
    >
      <div class="flex items-center gap-4 z-10">
        <div class="w-12 h-12 rounded-xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300">
          <Clock class="w-7 h-7 animate-pulse text-amber-400" />
        </div>
        <div>
          <span class="text-xs font-black uppercase tracking-widest text-amber-300">[{{ match.courtName }}] &bull; STAND BY</span>
          <h2 class="text-2xl font-black uppercase text-white tracking-wider font-display drop-shadow">
            MENUNGGU MATCH BERIKUTNYA
          </h2>
        </div>
      </div>
      <div class="px-4 py-1.5 rounded-xl bg-black/70 border border-amber-400/60 text-xs font-bold text-slate-300 uppercase tracking-widest">
        Bagan Turnamen Sedang Berlangsung
      </div>
    </div>

    <!-- 4. TAMPILAN SCOREBOARD RESMI DENGAN MATCH KEY TERTENTU -->
    <div v-else class="w-full flex flex-col items-center">
      <!-- Tournament & Round Mini Header -->
      <div class="px-6 py-1 bg-black/90 border-t border-x border-amber-500/50 rounded-t-md flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-amber-300 shadow-md">
        <span class="text-amber-400 font-black">[{{ match.courtName }}]</span>
        <span>{{ match.tournamentName }}</span>
        <span class="w-1 h-1 rounded-full bg-amber-400/80"></span>
        <span class="text-white">{{ match.roundName }}</span>
      </div>

      <!-- Main Scoreboard Container (Mobile Legibility Enhanced) -->
      <div class="w-full h-[90px] metallic-card shimmer-sweep rounded-2xl border-2 border-amber-500/60 flex items-stretch overflow-hidden relative shadow-2xl">
        
        <!-- Left Wing: Blue Team -->
        <div class="flex-1 bg-team-blue aura-blue flex items-center justify-between px-3.5 relative overflow-hidden transition-all duration-300">
          <div class="absolute inset-0 bg-gradient-to-r from-blue-900/60 to-transparent pointer-events-none"></div>

          <!-- Team Identity -->
          <div class="flex items-center gap-2.5 z-10 min-w-0 flex-1 mr-2">
            <div class="w-13 h-13 shrink-0 rounded-xl p-1 bg-black/60 border-2 border-blue-400/80 logo-ring-blue flex items-center justify-center shadow-lg transition-transform hover:scale-105">
              <img
                v-if="match.teamA.logoUrl"
                :src="match.teamA.logoUrl"
                :alt="match.teamA.name"
                class="w-10 h-10 object-contain"
              />
              <div
                v-else
                class="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-sm font-display"
              >
                {{ match.teamA.shortName.slice(0, 3) }}
              </div>
            </div>

            <div class="min-w-0 flex-1 flex flex-col justify-center overflow-hidden">
              <h2
                class="font-black uppercase text-white truncate font-rajdhani drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] leading-tight whitespace-nowrap"
                :class="getTeamNameClass(match.teamA.name)"
              >
                {{ match.teamA.name }}
              </h2>
            </div>
          </div>

          <!-- Gems & Score Number -->
          <div class="flex items-center gap-2.5 z-10 shrink-0">
            <GemPoints :format="match.format" :score="match.teamA.score" side="left" size="md" />
            <div
              class="w-12 shrink-0 text-center text-5xl md:text-6xl font-black font-display text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.6)]"
              :class="{ 'score-pop': scoreAPopping }"
            >
              {{ match.teamA.score }}
            </div>
          </div>
        </div>

        <!-- Center Hub: Format & VS Badge -->
        <div class="w-28 shrink-0 bg-gradient-to-b from-gray-900 via-black to-gray-950 border-x-2 border-amber-500/80 flex flex-col items-center justify-center relative shadow-inner z-20">
          <div class="absolute -top-1 w-12 h-1 bg-amber-400 blur-[1px]"></div>
          
          <span class="text-[9px] font-black tracking-widest text-slate-400 uppercase">SERIES</span>
          <div class="px-3 py-0.5 my-1 rounded bg-amber-500/25 border-2 border-amber-400 text-amber-300 font-black text-sm tracking-widest shadow-gold-glow">
            {{ match.format }}
          </div>
          <span class="text-[11px] font-black text-amber-400/90 tracking-widest">VS</span>
          
          <div class="absolute -bottom-1 w-12 h-1 bg-amber-400 blur-[1px]"></div>
        </div>

        <!-- Right Wing: Red Team -->
        <div class="flex-1 bg-team-red aura-red flex items-center justify-between px-3.5 relative overflow-hidden transition-all duration-300">
          <div class="absolute inset-0 bg-gradient-to-l from-red-900/60 to-transparent pointer-events-none"></div>

          <!-- Score Number & Gems -->
          <div class="flex items-center gap-2.5 z-10 shrink-0">
            <div
              class="w-12 shrink-0 text-center text-5xl md:text-6xl font-black font-display text-white drop-shadow-[0_2px_12px_rgba(255,255,255,0.6)]"
              :class="{ 'score-pop': scoreBPopping }"
            >
              {{ match.teamB.score }}
            </div>
            <GemPoints :format="match.format" :score="match.teamB.score" side="right" size="md" />
          </div>

          <!-- Team Identity -->
          <div class="flex items-center gap-2.5 z-10 min-w-0 flex-1 ml-2 justify-end">
            <div class="min-w-0 flex-1 flex flex-col items-end justify-center text-right overflow-hidden">
              <h2
                class="font-black uppercase text-white truncate font-rajdhani drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] leading-tight text-right w-full whitespace-nowrap"
                :class="getTeamNameClass(match.teamB.name)"
              >
                {{ match.teamB.name }}
              </h2>
            </div>

            <div class="w-13 h-13 shrink-0 rounded-xl p-1 bg-black/60 border-2 border-red-400/80 logo-ring-red flex items-center justify-center shadow-lg transition-transform hover:scale-105">
              <img
                v-if="match.teamB.logoUrl"
                :src="match.teamB.logoUrl"
                :alt="match.teamB.name"
                class="w-10 h-10 object-contain"
              />
              <div
                v-else
                class="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center font-black text-white text-sm font-display"
              >
                {{ match.teamB.shortName.slice(0, 3) }}
              </div>
            </div>
          </div>
        </div>

        <!-- WINNER CELEBRATION OVERLAY -->
        <WinnerOverlay
          :winner="winningTeam"
          :format="match.format"
        />
      </div>

      <!-- Sponsor Running Text Ticker Bar -->
      <SponsorTicker
        :show="settings.showTicker"
        :text="settings.tickerText"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useMatchStore } from "../stores/useMatchStore";
import GemPoints from "../components/overlay/GemPoints.vue";
import MatchPointBadge from "../components/overlay/MatchPointBadge.vue";
import WinnerOverlay from "../components/overlay/WinnerOverlay.vue";
import SponsorTicker from "../components/overlay/SponsorTicker.vue";
import { KeyRound, Clock } from "lucide-vue-next";

const route = useRoute();
const matchStore = useMatchStore();

const currentKey = ref<string>("");
const baseUrl = ref(window.location.origin);

const match = computed(() => matchStore.match);
const settings = computed(() => matchStore.settings);

// Option A: Score Pop & Neon Flash Burst Animation
const scoreAPopping = ref(false);
const scoreBPopping = ref(false);

watch(
  () => match.value?.teamA.score,
  (newVal, oldVal) => {
    if (oldVal !== undefined && newVal !== oldVal) {
      scoreAPopping.value = true;
      setTimeout(() => {
        scoreAPopping.value = false;
      }, 800);
    }
  }
);

watch(
  () => match.value?.teamB.score,
  (newVal, oldVal) => {
    if (oldVal !== undefined && newVal !== oldVal) {
      scoreBPopping.value = true;
      setTimeout(() => {
        scoreBPopping.value = false;
      }, 800);
    }
  }
);

const winningTeam = computed(() => {
  if (!match.value || !match.value.isCompleted || !match.value.winnerTeam) return null;
  return match.value.winnerTeam === "A" ? match.value.teamA : match.value.teamB;
});

function getTeamNameClass(name?: string) {
  if (!name) return "text-xl md:text-2xl tracking-wider";
  const len = name.length;
  if (len >= 17) return "text-sm md:text-base tracking-tight";
  if (len >= 13) return "text-base md:text-lg tracking-normal";
  if (len >= 9) return "text-lg md:text-xl tracking-wide";
  return "text-xl md:text-2xl tracking-wider";
}

function initOverlayKey() {
  const queryKey = (route.query.key as string) || (route.params.key as string);
  if (queryKey) {
    currentKey.value = queryKey;
    matchStore.joinMatchRoom(queryKey);
  }
}

watch(
  () => route.query.key,
  (newKey) => {
    if (newKey && typeof newKey === "string") {
      currentKey.value = newKey;
      matchStore.joinMatchRoom(newKey);
    }
  }
);

onMounted(() => {
  initOverlayKey();
});
</script>
