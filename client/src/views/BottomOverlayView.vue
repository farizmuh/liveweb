<template>
  <!-- FULL-WIDTH BROADCAST FOOTER (1920 x 200px) -->
  <div class="w-[1920px] h-[200px] relative overflow-hidden bg-gradient-to-b from-[#0d121f] via-[#090d16] to-[#04060a] border-t-2 border-amber-500/80 shadow-[0_-10px_35px_rgba(0,0,0,0.9)] select-none flex flex-col justify-between">
    
    <!-- AMBIENT TEAM GLOW ON SIDES -->
    <div class="absolute inset-y-0 left-0 w-96 bg-blue-600/15 blur-3xl pointer-events-none"></div>
    <div class="absolute inset-y-0 right-0 w-96 bg-red-600/15 blur-3xl pointer-events-none"></div>

    <!-- 1. JIKA TIDAK ADA KEY DI URL: PANDUAN TRANSPARAN -->
    <div
      v-if="!currentKey"
      class="w-full h-full p-4 flex flex-col items-center justify-center text-center bg-black/90 backdrop-blur-md z-50"
    >
      <div class="flex items-center justify-center gap-2 text-amber-400 font-bold text-base uppercase tracking-wider mb-2">
        <KeyRound class="w-6 h-6 animate-pulse" />
        <span>BOTTOM FOOTER OVERLAY: KUNCI PERTANDINGAN DIPERLUKAN</span>
      </div>
      <p class="text-xs text-slate-300 max-w-xl mx-auto mb-3">
        Masukkan parameter key pada URL Browser Source OBS (Resolusi: <b>Width 1920, Height 200</b>):
      </p>
      <div class="px-5 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-amber-300 text-sm inline-block shadow">
        {{ baseUrl }}/overlay/bottom?key=<b>&lt;MATCH-KEY&gt;</b>
      </div>
      <div class="mt-2 text-xs text-slate-400">
        Contoh: <span class="text-white font-mono">/overlay/bottom?key=match-c1-8f3a9b</span> (Court 1)
      </div>
    </div>

    <!-- 2. JIKA KEY ADA TAPI DATA SEDANG DIMUAT -->
    <div
      v-else-if="!match"
      class="w-full h-full flex items-center justify-center text-sm text-amber-400 font-bold gap-2 animate-pulse"
    >
      <span>Menghubungkan ke Bottom Overlay [{{ currentKey }}]...</span>
    </div>

    <!-- 3. JIKA SEDANG MENUNGGU MATCH BERIKUTNYA -->
    <div
      v-else-if="match.isWaitingForNext"
      class="w-full h-full metallic-card border-t-2 border-amber-400 p-6 flex items-center justify-between shadow-2xl relative overflow-hidden"
    >
      <div class="flex items-center gap-6 z-10">
        <div class="w-20 h-20 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shadow-gold-glow">
          <Clock class="w-10 h-10 text-amber-400 animate-pulse" />
        </div>
        <div class="space-y-1">
          <span class="px-3 py-1 rounded bg-amber-500/20 border border-amber-400 text-amber-300 font-black text-xs uppercase tracking-widest shadow">
            {{ match.courtName }} &bull; MEJA SIAP
          </span>
          <h2 class="text-4xl font-black uppercase text-white font-display tracking-wider drop-shadow">
            MENUNGGU PERTANDINGAN BERIKUTNYA
          </h2>
          <p class="text-xs font-bold text-slate-300 tracking-widest uppercase">
            Bagan Turnamen Sedang Berlangsung &bull; Pertandingan Baru Akan Segera Dimulai
          </p>
        </div>
      </div>

      <div class="flex items-center gap-4 z-10 pr-6">
        <div class="text-right">
          <span class="text-xs font-bold text-amber-400 uppercase tracking-widest block">{{ match.tournamentName }}</span>
          <span class="text-sm font-black text-white uppercase font-rajdhani">Official Esports Broadcast</span>
        </div>
        <div class="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center">
          <Trophy class="w-8 h-8 text-amber-400 animate-bounce" />
        </div>
      </div>
    </div>

    <!-- 4. TAMPILAN RESMI 1920x200 (3-SECTION LAYOUT) -->
    <template v-else>
      <!-- TOP GLOWING DIVIDER STRIP (TICKER PEMBATAS DENGAN LAYAR GAME HP) -->
      <div
        class="w-full h-7 bg-black/90 border-b border-amber-500/50 flex items-center justify-between px-6 z-20 shadow-md relative"
      >
        <!-- Gold border lighting accent -->
        <div class="absolute -top-[2px] inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>

        <div class="flex items-center gap-2 text-amber-400 font-extrabold text-[11px] uppercase tracking-widest shrink-0 border-r border-amber-500/40 pr-4">
          <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          <span>LIVE BROADCAST</span>
          <span class="text-slate-500">&bull;</span>
          <span class="text-white">{{ match.courtName }}</span>
        </div>

        <!-- Marquee Ticker Text -->
        <div class="overflow-hidden whitespace-nowrap flex-1 mx-4">
          <div class="animate-marquee font-bold text-xs text-slate-200 uppercase tracking-wider">
            {{ settings.tickerText }}
          </div>
        </div>

        <!-- Right badge -->
        <div class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-300 shrink-0 border-l border-amber-500/40 pl-4">
          <span>{{ match.tournamentName }}</span>
        </div>
      </div>

      <!-- MAIN 3-SECTION BROADCAST BODY (Height: ~170px) -->
      <div class="w-full flex-1 flex items-center justify-between px-8 py-3 relative z-10 gap-6">
        
        <!-- SECTION 1: LEFT WING (INFO TURNAMEN & BABAK) -->
        <div class="w-[360px] shrink-0 flex flex-col justify-center border-r border-slate-800/80 pr-6 space-y-1.5">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-400/60 font-black text-xs uppercase tracking-widest shadow-gold-glow">
              {{ match.courtName }}
            </span>
            <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-xs">
              {{ match.format }}
            </span>
          </div>

          <h3 class="text-xl font-black uppercase tracking-wider text-white font-display truncate">
            {{ match.tournamentName }}
          </h3>
          <p class="text-xs font-bold text-amber-300/90 uppercase tracking-widest">
            {{ match.roundName }}
          </p>

          <div class="flex items-center gap-2 text-[10px] text-slate-400 font-mono pt-0.5">
            <span>KEY:</span>
            <code class="text-slate-300 font-bold">{{ match.matchKey }}</code>
          </div>
        </div>

        <!-- SECTION 2: CENTER SCOREBOARD (BLUE VS RED - JUMBO MOBILE FRIENDLY) -->
        <div class="flex-1 max-w-[1140px] h-[140px] metallic-card shimmer-sweep rounded-2xl border-2 border-amber-500/80 flex items-stretch overflow-hidden relative shadow-2xl">
          
          <!-- Blue Team (Left) -->
          <div class="flex-1 bg-team-blue aura-blue flex items-center justify-between px-6 relative overflow-hidden transition-all duration-300">
            <div class="absolute inset-0 bg-gradient-to-r from-blue-950/80 to-transparent pointer-events-none"></div>

            <!-- Identity -->
            <div class="flex items-center gap-4 z-10 min-w-0 flex-1 mr-4">
              <div class="w-18 h-18 shrink-0 rounded-2xl p-1.5 bg-black/70 border-2 border-blue-400/80 logo-ring-blue flex items-center justify-center shadow-blue-glow transition-transform hover:scale-105">
                <img
                  v-if="match.teamA.logoUrl"
                  :src="match.teamA.logoUrl"
                  :alt="match.teamA.name"
                  class="w-full h-full object-contain"
                />
                <div
                  v-else
                  class="w-full h-full rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-2xl font-display"
                >
                  {{ match.teamA.shortName.slice(0, 3) }}
                </div>
              </div>

              <div class="min-w-0 flex-1 flex flex-col justify-center">
                <h2
                  class="font-black uppercase text-white truncate font-rajdhani drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] leading-tight whitespace-nowrap"
                  :class="getTeamNameClass(match.teamA.name)"
                >
                  {{ match.teamA.name }}
                </h2>
                <p
                  v-if="match.teamA.institution"
                  class="font-bold text-amber-300 uppercase font-sans truncate drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] max-w-full mt-0.5"
                  :class="getInstitutionClass(match.teamA.institution)"
                >
                  {{ match.teamA.institution }}
                </p>
              </div>
            </div>

            <!-- Gems & Huge Score -->
            <div class="flex items-center gap-5 z-10 shrink-0">
              <GemPoints :format="match.format" :score="match.teamA.score" side="left" size="lg" />
              <div
                class="w-20 shrink-0 text-center text-7xl font-black font-display text-white drop-shadow-[0_4px_16px_rgba(255,255,255,0.7)]"
                :class="{ 'score-pop': scoreAPopping }"
              >
                {{ match.teamA.score }}
              </div>
            </div>
          </div>

          <!-- Center VS Hub -->
          <div class="w-28 shrink-0 bg-gradient-to-b from-gray-950 via-black to-gray-950 border-x-2 border-amber-500/80 flex flex-col items-center justify-center relative shadow-inner z-20">
            <div class="absolute -top-1 w-14 h-1 bg-amber-400 blur-[1px]"></div>
            
            <span class="text-[9px] font-black tracking-widest text-slate-400 uppercase">SERIES</span>
            <div class="px-3.5 py-1 my-1 rounded-lg bg-amber-500/25 border-2 border-amber-400 text-amber-300 font-black text-sm tracking-widest shadow-gold-glow">
              {{ match.format }}
            </div>
            <span class="text-xs font-black text-amber-400 tracking-widest">VS</span>
            
            <div class="absolute -bottom-1 w-14 h-1 bg-amber-400 blur-[1px]"></div>
          </div>

          <!-- Red Team (Right) -->
          <div class="flex-1 bg-team-red aura-red flex items-center justify-between px-6 relative overflow-hidden transition-all duration-300">
            <div class="absolute inset-0 bg-gradient-to-l from-red-950/80 to-transparent pointer-events-none"></div>

            <!-- Huge Score & Gems -->
            <div class="flex items-center gap-5 z-10 shrink-0">
              <div
                class="w-20 shrink-0 text-center text-7xl font-black font-display text-white drop-shadow-[0_4px_16px_rgba(255,255,255,0.7)]"
                :class="{ 'score-pop': scoreBPopping }"
              >
                {{ match.teamB.score }}
              </div>
              <GemPoints :format="match.format" :score="match.teamB.score" side="right" size="lg" />
            </div>

            <!-- Identity -->
            <div class="flex items-center gap-4 z-10 min-w-0 flex-1 ml-4 justify-end">
              <div class="min-w-0 flex-1 flex flex-col items-end justify-center text-right">
                <h2
                  class="font-black uppercase text-white truncate font-rajdhani drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] leading-tight text-right w-full whitespace-nowrap"
                  :class="getTeamNameClass(match.teamB.name)"
                >
                  {{ match.teamB.name }}
                </h2>
                <p
                  v-if="match.teamB.institution"
                  class="font-bold text-amber-300 uppercase font-sans truncate text-right drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] max-w-full mt-0.5"
                  :class="getInstitutionClass(match.teamB.institution)"
                >
                  {{ match.teamB.institution }}
                </p>
              </div>

              <div class="w-18 h-18 shrink-0 rounded-2xl p-1.5 bg-black/70 border-2 border-red-400/80 logo-ring-red flex items-center justify-center shadow-red-glow transition-transform hover:scale-105">
                <img
                  v-if="match.teamB.logoUrl"
                  :src="match.teamB.logoUrl"
                  :alt="match.teamB.name"
                  class="w-full h-full object-contain"
                />
                <div
                  v-else
                  class="w-full h-full rounded-xl bg-red-600 flex items-center justify-center font-black text-white text-2xl font-display"
                >
                  {{ match.teamB.shortName.slice(0, 3) }}
                </div>
              </div>
            </div>
          </div>

          <!-- WINNER OVERLAY TAKEOVER -->
          <WinnerOverlay
            :winner="winningTeam"
            :format="match.format"
          />
        </div>

        <!-- SECTION 3: RIGHT WING (SPONSOR & MEDIA SOSIAL) -->
        <div class="w-[360px] shrink-0 flex flex-col justify-center border-l border-slate-800/80 pl-6 space-y-1.5 text-right">
          <div class="flex items-center justify-end gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
            <Trophy class="w-3.5 h-3.5" />
            <span>OFFICIAL ESPORTS BROADCAST</span>
          </div>

          <div class="flex items-center justify-end gap-3 py-1">
            <div class="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300">
              #MLBBIndo
            </div>
            <div class="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300">
              #MPLID
            </div>
            <div class="px-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-amber-400">
              #GameOn
            </div>
          </div>

          <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Turnamen Resmi &bull; Ikuti Live Stream
          </p>
        </div>

      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { useMatchStore } from "../stores/useMatchStore";
import GemPoints from "../components/overlay/GemPoints.vue";
import MatchPointBadge from "../components/overlay/MatchPointBadge.vue";
import WinnerOverlay from "../components/overlay/WinnerOverlay.vue";
import { KeyRound, Trophy, Clock } from "lucide-vue-next";

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
  if (!name) return "text-3xl md:text-4xl tracking-wider";
  const len = name.length;
  if (len >= 20) return "text-xl md:text-2xl tracking-tight";
  if (len >= 14) return "text-2xl md:text-3xl tracking-normal";
  if (len >= 10) return "text-3xl md:text-3.5xl tracking-wide";
  return "text-3xl md:text-4xl tracking-wider";
}

function getInstitutionClass(inst?: string | null) {
  if (!inst) return "text-xs";
  const len = inst.length;
  if (len >= 32) return "text-[9px] md:text-[10px] tracking-tight leading-tight";
  if (len >= 24) return "text-[10px] md:text-[11px] tracking-normal leading-tight";
  if (len >= 16) return "text-[11px] md:text-xs tracking-wide leading-snug";
  return "text-xs md:text-sm tracking-wider leading-snug";
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
