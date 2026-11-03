<template>
  <div class="rounded-2xl p-4 bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
    <div class="flex items-center justify-between pb-2 border-b border-slate-800">
      <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2">
        <Megaphone class="w-4 h-4 text-amber-400" />
        <span>Banner Sponsor & Running Text</span>
      </h3>
      
      <!-- Toggle ON/OFF -->
      <label class="flex items-center gap-2 cursor-pointer">
        <span class="text-xs font-bold" :class="showTicker ? 'text-amber-400' : 'text-slate-400'">
          {{ showTicker ? 'TAMPIL DI OBS' : 'DISEMBUNYIKAN' }}
        </span>
        <input
          type="checkbox"
          v-model="showTicker"
          @change="saveSettings"
          class="sr-only"
        />
        <div
          class="w-10 h-5 bg-slate-800 rounded-full transition-colors relative"
          :class="{ 'bg-amber-500': showTicker }"
        >
          <div
            class="w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 left-0.5"
            :class="{ 'translate-x-5': showTicker }"
          ></div>
        </div>
      </label>
    </div>

    <div>
      <label class="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
        Teks Berjalan (Running Ticker)
      </label>
      <div class="flex gap-2">
        <input
          v-model="tickerText"
          type="text"
          placeholder="Tulis pesan pengumuman / sponsor..."
          class="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-medium text-white focus:border-amber-400 focus:outline-none"
        />
        <button
          @click="saveSettings"
          class="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs active:scale-95 transition"
        >
          Update
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useMatchStore } from "../../stores/useMatchStore";
import { Megaphone } from "lucide-vue-next";

const matchStore = useMatchStore();

const tickerText = ref(matchStore.settings.tickerText);
const showTicker = ref(matchStore.settings.showTicker);

watch(
  () => matchStore.settings,
  (s) => {
    tickerText.value = s.tickerText;
    showTicker.value = s.showTicker;
  },
  { deep: true }
);

function saveSettings() {
  matchStore.updateSettings({
    tickerText: tickerText.value,
    showTicker: showTicker.value,
  });
}
</script>

