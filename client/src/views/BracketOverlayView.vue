<template>
  <!-- 1920x1080 FULL BROADCAST OVERLAY UNTUK OBS TOURNAMENT BRACKET -->
  <div class="w-[1920px] h-[1080px] relative overflow-hidden bg-gradient-to-b from-[#070a12]/95 via-[#0b101d]/90 to-[#030508]/98 border-4 border-amber-500/40 p-8 select-none flex flex-col justify-between">
    
    <!-- Ambient Lightings -->
    <div class="absolute -top-32 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
    <div class="absolute -bottom-32 right-1/4 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[120px] pointer-events-none"></div>

    <!-- HEADER TURNAMEN -->
    <header class="w-full flex items-center justify-between pb-4 border-b-2 border-amber-500/40 z-10">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-black font-black text-2xl shadow-gold-glow">
          MLBB
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400 font-black text-xs uppercase tracking-widest shadow">
              {{ tournament?.type === 'DOUBLE_ELIMINATION' ? 'DOUBLE ELIMINATION' : 'SINGLE ELIMINATION' }}
            </span>
            <span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-xs uppercase">
              SERIES {{ tournament?.format || 'BO3' }}
            </span>
          </div>
          <h1 class="text-3xl font-black uppercase tracking-wider text-white font-display mt-0.5">
            {{ tournament?.name || 'BAGAN TURNAMEN RESMI' }}
          </h1>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <div class="px-4 py-2 rounded-xl bg-black/60 border border-amber-500/40 flex items-center gap-2">
          <Trophy class="w-5 h-5 text-amber-400 animate-bounce" />
          <span class="text-xs font-black text-amber-300 uppercase tracking-widest">TOURNAMENT BRACKET STAGE</span>
        </div>
      </div>
    </header>

    <!-- CONTENT: BRACKET TREE -->
    <main class="w-full flex-1 flex items-center justify-around py-6 overflow-x-auto z-10 gap-8">
      <div v-if="!tournament || rounds.length === 0" class="text-center text-slate-400 text-lg font-bold">
        Memuat bagan turnamen...
      </div>

      <!-- ROUND COLUMNS -->
      <div
        v-for="roundObj in rounds"
        :key="roundObj.round"
        class="flex-1 flex flex-col justify-around h-full min-w-[260px] max-w-[320px]"
      >
        <!-- Round Title Header -->
        <div class="text-center pb-3">
          <span class="px-3 py-1 rounded-lg bg-black/80 border border-amber-500/50 text-amber-300 font-black text-xs uppercase tracking-widest shadow">
            {{ roundObj.name }}
          </span>
        </div>

        <!-- Matches in this Round -->
        <div class="flex-1 flex flex-col justify-around py-2 gap-4">
          <div
            v-for="m in roundObj.matches"
            :key="m.id"
            class="rounded-xl metallic-card border transition-all duration-300 shadow-xl overflow-hidden relative"
            :class="[
              m.status === 'LIVE' ? 'border-2 border-amber-400 shadow-gold-glow scale-[1.02]' : 'border-slate-700/80'
            ]"
          >
            <!-- Live Indicator Badge -->
            <div
              v-if="m.status === 'LIVE'"
              class="w-full bg-red-600/90 text-white text-[10px] font-black uppercase tracking-widest text-center py-0.5 flex items-center justify-center gap-1.5 shadow"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
              <span>LIVE DI {{ m.assignedCourt || 'COURT' }}</span>
            </div>

            <!-- Team A Row -->
            <div
              class="flex items-center justify-between p-2.5 transition-colors border-b border-slate-800"
              :class="[
                m.winnerTeam === 'A' ? 'bg-amber-500/20 font-bold' : 'bg-slate-950/60',
                m.isBye && !m.teamAId ? 'opacity-40' : ''
              ]"
            >
              <div class="flex items-center gap-2.5 overflow-hidden">
                <div class="w-7 h-7 rounded bg-black/60 border border-slate-700 p-0.5 flex items-center justify-center shrink-0">
                  <img v-if="m.teamALogo" :src="m.teamALogo" class="w-full h-full object-contain" />
                  <span v-else class="text-[10px] font-bold text-amber-400">{{ m.teamAShort?.slice(0, 3) || '?' }}</span>
                </div>
                <span class="text-sm font-black uppercase text-white truncate max-w-[150px]">
                  {{ m.teamAName || (m.isBye ? 'BYE' : 'TBD') }}
                </span>
              </div>
              <div
                class="w-7 text-center font-display text-xl font-black text-white"
                :class="m.winnerTeam === 'A' ? 'text-amber-300 drop-shadow' : 'text-slate-400'"
              >
                {{ m.scoreA }}
              </div>
            </div>

            <!-- Team B Row -->
            <div
              class="flex items-center justify-between p-2.5 transition-colors"
              :class="[
                m.winnerTeam === 'B' ? 'bg-amber-500/20 font-bold' : 'bg-slate-950/60',
                m.isBye && !m.teamBId ? 'opacity-40' : ''
              ]"
            >
              <div class="flex items-center gap-2.5 overflow-hidden">
                <div class="w-7 h-7 rounded bg-black/60 border border-slate-700 p-0.5 flex items-center justify-center shrink-0">
                  <img v-if="m.teamBLogo" :src="m.teamBLogo" class="w-full h-full object-contain" />
                  <span v-else class="text-[10px] font-bold text-amber-400">{{ m.teamBShort?.slice(0, 3) || '?' }}</span>
                </div>
                <span class="text-sm font-black uppercase text-white truncate max-w-[150px]">
                  {{ m.teamBName || (m.isBye ? 'BYE' : 'TBD') }}
                </span>
              </div>
              <div
                class="w-7 text-center font-display text-xl font-black text-white"
                :class="m.winnerTeam === 'B' ? 'text-amber-300 drop-shadow' : 'text-slate-400'"
              >
                {{ m.scoreB }}
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>

    <!-- FOOTER INFO -->
    <footer class="w-full flex items-center justify-between pt-3 border-t-2 border-amber-500/40 text-xs text-slate-400 z-10">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span class="font-bold text-slate-300">LIVE BRACKET SYNC &bull; TOURNAMENT PLATFORM</span>
      </div>
      <div class="font-bold text-amber-400 tracking-wider">
        MOBILE LEGENDS COMMUNITY ESPORTS BROADCAST
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useBracketStore, type BracketMatchNode } from "../stores/useBracketStore";
import { Trophy } from "lucide-vue-next";

const route = useRoute();
const bracketStore = useBracketStore();

const tournament = computed(() => bracketStore.tournament);

// Group matches by round for bracket tree columns
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

onMounted(() => {
  const tourneyId = (route.query.id as string) || undefined;
  bracketStore.initSocket(tourneyId);
  bracketStore.fetchActiveBracket(tourneyId);
});
</script>

