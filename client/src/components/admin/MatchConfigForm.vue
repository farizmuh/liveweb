<template>
  <div class="rounded-2xl p-4 bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
    <div class="flex items-center justify-between pb-2 border-b border-slate-800">
      <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2">
        <Settings2 class="w-4 h-4 text-amber-400" />
        <span>Pengaturan Match & Tim</span>
      </h3>
      <span class="text-[11px] text-slate-400">Sinkronisasi Otomatis</span>
    </div>

    <!-- TOURNAMENT & ROUND ROW -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Nama Turnamen</label>
        <input
          v-model="tournamentName"
          @change="updateConfig"
          type="text"
          placeholder="cth: MPL INDONESIA S14"
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-semibold text-white focus:border-amber-400 focus:outline-none"
        />
      </div>

      <div>
        <label class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Babak Pertandingan</label>
        <input
          v-model="roundName"
          @change="updateConfig"
          type="text"
          placeholder="cth: GRAND FINALS / MATCH 1"
          class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-semibold text-white focus:border-amber-400 focus:outline-none"
        />
      </div>
    </div>

    <!-- FORMAT MATCH (BO1, BO3, BO5, BO7) -->
    <div>
      <label class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">Format Pertandingan</label>
      <div class="grid grid-cols-4 gap-2">
        <button
          v-for="fmt in ['BO1', 'BO3', 'BO5', 'BO7']"
          :key="fmt"
          @click="selectFormat(fmt as any)"
          :class="[
            format === fmt
              ? 'bg-amber-500 text-black font-black border-amber-400 shadow-gold-glow'
              : 'bg-slate-800/90 text-slate-300 font-bold border-slate-700 hover:bg-slate-750'
          ]"
          class="py-2 rounded-xl border text-xs tracking-wider transition active:scale-95"
        >
          {{ fmt }}
        </button>
      </div>
    </div>

    <!-- PRESET TIM SELECTION -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
      <!-- TEAM A (BLUE) SELECTOR -->
      <div class="p-3 rounded-xl bg-blue-950/40 border border-blue-900/60 space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-[11px] font-bold text-blue-300 uppercase tracking-wider">Tim A (Biru)</label>
          <span class="text-[10px] text-blue-400">Pilih Preset</span>
        </div>

        <select
          @change="onSelectPresetA($event)"
          class="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-blue-700/60 text-xs font-semibold text-white focus:outline-none"
        >
          <option value="">-- Pilih dari Database Tim --</option>
          <option v-for="t in teamStore.teams" :key="t.id" :value="t.id">
            [{{ t.shortName }}] {{ t.name }}{{ t.institution ? ' - ' + t.institution : '' }}
          </option>
        </select>

        <div class="grid grid-cols-3 gap-2 pt-1">
          <div class="col-span-2">
            <input
              v-model="teamAName"
              @change="updateConfig"
              type="text"
              placeholder="Nama Tim A"
              class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
            />
          </div>
          <div>
            <input
              v-model="teamAShort"
              @change="updateConfig"
              type="text"
              placeholder="Tag"
              class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white uppercase focus:outline-none"
            />
          </div>
        </div>
      </div>

      <!-- TEAM B (RED) SELECTOR -->
      <div class="p-3 rounded-xl bg-red-950/40 border border-red-900/60 space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-[11px] font-bold text-red-300 uppercase tracking-wider">Tim B (Merah)</label>
          <span class="text-[10px] text-red-400">Pilih Preset</span>
        </div>

        <select
          @change="onSelectPresetB($event)"
          class="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-red-700/60 text-xs font-semibold text-white focus:outline-none"
        >
          <option value="">-- Pilih dari Database Tim --</option>
          <option v-for="t in teamStore.teams" :key="t.id" :value="t.id">
            [{{ t.shortName }}] {{ t.name }}{{ t.institution ? ' - ' + t.institution : '' }}
          </option>
        </select>

        <div class="grid grid-cols-3 gap-2 pt-1">
          <div class="col-span-2">
            <input
              v-model="teamBName"
              @change="updateConfig"
              type="text"
              placeholder="Nama Tim B"
              class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none"
            />
          </div>
          <div>
            <input
              v-model="teamBShort"
              @change="updateConfig"
              type="text"
              placeholder="Tag"
              class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white uppercase focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useMatchStore } from "../../stores/useMatchStore";
import { useTeamStore } from "../../stores/useTeamStore";
import { Settings2 } from "lucide-vue-next";

const matchStore = useMatchStore();
const teamStore = useTeamStore();

const tournamentName = ref(matchStore.match?.tournamentName || "");
const roundName = ref(matchStore.match?.roundName || "");
const format = ref(matchStore.match?.format || "BO3");

const teamAName = ref(matchStore.match?.teamA?.name || "");
const teamAShort = ref(matchStore.match?.teamA?.shortName || "");
const teamALogo = ref<string | null | undefined>(matchStore.match?.teamA?.logoUrl);
const teamAInstitution = ref<string | null | undefined>(matchStore.match?.teamA?.institution);

const teamBName = ref(matchStore.match?.teamB?.name || "");
const teamBShort = ref(matchStore.match?.teamB?.shortName || "");
const teamBLogo = ref<string | null | undefined>(matchStore.match?.teamB?.logoUrl);
const teamBInstitution = ref<string | null | undefined>(matchStore.match?.teamB?.institution);

watch(
  () => matchStore.match,
  (m) => {
    if (!m) return;
    tournamentName.value = m.tournamentName;
    roundName.value = m.roundName;
    format.value = m.format;
    teamAName.value = m.teamA?.name || "";
    teamAShort.value = m.teamA?.shortName || "";
    teamALogo.value = m.teamA?.logoUrl || "";
    teamAInstitution.value = m.teamA?.institution || "";
    teamBName.value = m.teamB?.name || "";
    teamBShort.value = m.teamB?.shortName || "";
    teamBLogo.value = m.teamB?.logoUrl || "";
    teamBInstitution.value = m.teamB?.institution || "";
  },
  { deep: true, immediate: true }
);

onMounted(() => {
  teamStore.fetchTeams();
});

function selectFormat(newFmt: "BO1" | "BO3" | "BO5" | "BO7") {
  format.value = newFmt;
  updateConfig();
}

function onSelectPresetA(e: Event) {
  const teamId = (e.target as HTMLSelectElement).value;
  const team = teamStore.teams.find((t) => t.id === teamId);
  if (team) {
    teamAName.value = team.name;
    teamAShort.value = team.shortName;
    teamALogo.value = team.logoUrl;
    teamAInstitution.value = team.institution || null;
    updateConfig();
  }
}

function onSelectPresetB(e: Event) {
  const teamId = (e.target as HTMLSelectElement).value;
  const team = teamStore.teams.find((t) => t.id === teamId);
  if (team) {
    teamBName.value = team.name;
    teamBShort.value = team.shortName;
    teamBLogo.value = team.logoUrl;
    teamBInstitution.value = team.institution || null;
    updateConfig();
  }
}

function updateConfig() {
  matchStore.updateMatchConfig({
    tournamentName: tournamentName.value,
    roundName: roundName.value,
    format: format.value,
    teamA: {
      name: teamAName.value,
      shortName: teamAShort.value,
      logoUrl: teamALogo.value,
      institution: teamAInstitution.value,
    },
    teamB: {
      name: teamBName.value,
      shortName: teamBShort.value,
      logoUrl: teamBLogo.value,
      institution: teamBInstitution.value,
    },
  });
}
</script>

