<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-12 selection:bg-amber-500 selection:text-black">
    <!-- TOP NAVIGATION BAR -->
    <header class="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-lg">
      <div class="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <!-- Brand & Court / Role Info -->
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-black font-black text-xs shadow-gold-glow">
            MLBB
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-sm font-extrabold uppercase tracking-wider text-white">Esports Control Panel</h1>
              <!-- Role Badge -->
              <span
                class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"
                :class="authStore.user?.role === 'SUPERADMIN' ? 'bg-amber-500 text-black shadow-gold-glow' : 'bg-blue-600 text-white'"
              >
                {{ authStore.user?.role === 'SUPERADMIN' ? 'SUPERADMIN' : authStore.user?.name || 'WASIT' }}
              </span>
            </div>
            <p v-if="matchStore.match" class="text-[10px] text-amber-400 font-bold flex items-center gap-1.5">
              <span>🏟️ {{ matchStore.match.courtName }}</span>
              <span class="text-slate-400">&bull; Key: <code class="font-mono text-slate-200">{{ matchStore.match.matchKey }}</code></span>
            </p>
          </div>
        </div>

        <!-- Status Badges & OBS Copy -->
        <div class="flex items-center gap-2">
          <!-- Socket Status -->
          <div
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors"
            :class="[
              matchStore.isConnected
                ? 'bg-emerald-950/80 border-emerald-600/70 text-emerald-400'
                : 'bg-rose-950/80 border-rose-600/70 text-rose-400'
            ]"
          >
            <span
              class="w-2 h-2 rounded-full"
              :class="matchStore.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'"
            />
            <span>{{ matchStore.isConnected ? 'ONLINE' : 'OFFLINE' }}</span>
          </div>

          <!-- OBS Overlay Copy Links (Top and Bottom) -->
          <div class="flex items-center gap-1.5">
            <button
              @click="copyActiveOverlayUrl"
              class="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 active:scale-95 transition text-xs font-bold flex items-center gap-1 shadow"
              title="Salin Link Top Overlay (Scoreboard Atas)"
            >
              <Copy class="w-3.5 h-3.5" />
              <span>Top OBS</span>
            </button>

            <button
              @click="copyActiveBottomOverlayUrl"
              class="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 active:scale-95 transition text-xs font-bold flex items-center gap-1 shadow"
              title="Salin Link Bottom Overlay (Lower Third Bawah)"
            >
              <Copy class="w-3.5 h-3.5" />
              <span>Bottom OBS</span>
            </button>
          </div>

          <!-- Logout -->
          <button
            @click="handleLogout"
            class="p-2 rounded-lg bg-slate-800 hover:bg-red-900/60 text-slate-400 hover:text-red-300 border border-slate-700 active:scale-95 transition"
            title="Keluar"
          >
            <LogOut class="w-4 h-4" />
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
    <main class="max-w-6xl mx-auto w-full px-4 pt-4 space-y-4 flex-1">
      
      <!-- SUPERADMIN TABS (Only for Superadmin) -->
      <div v-if="authStore.user?.role === 'SUPERADMIN'" class="flex items-center gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold">
        <button
          @click="activeView = 'dashboard'"
          class="flex-1 py-2 text-center rounded-lg transition"
          :class="activeView === 'dashboard' ? 'bg-amber-500 text-black shadow' : 'text-slate-300 hover:text-white'"
        >
          📊 Monitoring 4 Meja Paralel
        </button>
        <button
          @click="activeView = 'controller'"
          class="flex-1 py-2 text-center rounded-lg transition"
          :class="activeView === 'controller' ? 'bg-amber-500 text-black shadow' : 'text-slate-300 hover:text-white'"
        >
          🎮 Kontrol Detail Match
        </button>
        <router-link
          to="/teams"
          class="flex-1 py-2 text-center rounded-lg text-slate-300 hover:text-white"
        >
          Database Tim
        </router-link>
      </div>

      <!-- VIEW A: SUPERADMIN CENTRAL 4-COURT DASHBOARD -->
      <section v-if="authStore.user?.role === 'SUPERADMIN' && activeView === 'dashboard'" class="space-y-4">
        <div class="flex items-center justify-between pb-1">
          <h2 class="text-sm font-bold text-slate-200 flex items-center gap-2">
            <LayoutGrid class="w-4 h-4 text-amber-400" />
            <span>Pemantauan Langsung 4 Pertandingan Paralel</span>
          </h2>
          <span class="text-xs text-slate-400">Live Sync 4 Komputer Siaran</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="m in matchStore.allMatches"
            :key="m.matchKey"
            class="rounded-2xl p-4 bg-slate-900/90 border border-slate-800 hover:border-slate-700 shadow-xl space-y-3 relative overflow-hidden"
          >
            <!-- Card Header -->
            <div class="flex items-center justify-between pb-2 border-b border-slate-800">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/50 font-black text-xs uppercase">
                  {{ m.courtName }}
                </span>
                <span class="text-xs font-bold text-slate-300">{{ m.format }}</span>
              </div>

              <!-- Copy OBS Links per court (Top & Bottom) -->
              <div class="flex items-center gap-1.5">
                <button
                  @click="copyKeyUrl(m.matchKey)"
                  class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-bold border border-slate-700 flex items-center gap-1 active:scale-95"
                  title="Salin Link Top Overlay"
                >
                  <Copy class="w-3 h-3" />
                  <span>Top OBS</span>
                </button>
                <button
                  @click="copyBottomKeyUrl(m.matchKey)"
                  class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[11px] font-bold border border-slate-700 flex items-center gap-1 active:scale-95"
                  title="Salin Link Bottom Overlay"
                >
                  <Copy class="w-3 h-3" />
                  <span>Bottom OBS</span>
                </button>
              </div>
            </div>

            <!-- Court Stream Info -->
            <div class="flex items-center justify-between text-[11px] text-slate-400">
              <span>Key: <code class="text-amber-300 font-mono font-bold">{{ m.matchKey }}</code></span>
              <span>Wasit: <b class="text-white">{{ m.assignedRefereeName || m.assignedRefereeUsername || 'Belum di-assign' }}</b></span>
            </div>

            <!-- Teams & Live Scores with inline +/- controls -->
            <div class="grid grid-cols-2 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
              <!-- Team Blue -->
              <div class="space-y-1">
                <span class="text-[10px] font-black text-blue-400 uppercase tracking-wider">TIM A (BIRU)</span>
                <div class="font-bold text-xs text-white truncate">{{ m.teamA.name }}</div>
                <div class="flex items-center gap-2 pt-1">
                  <span class="text-3xl font-black font-display text-white">{{ m.teamA.score }}</span>
                  <div class="flex flex-col gap-1">
                    <button
                      @click="matchStore.changeScore('A', 1, m.matchKey)"
                      class="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                    >+1</button>
                    <button
                      @click="matchStore.changeScore('A', -1, m.matchKey)"
                      :disabled="m.teamA.score <= 0"
                      class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs disabled:opacity-30"
                    >-1</button>
                  </div>
                </div>
              </div>

              <!-- Team Red -->
              <div class="space-y-1 text-right">
                <span class="text-[10px] font-black text-red-400 uppercase tracking-wider">TIM B (MERAH)</span>
                <div class="font-bold text-xs text-white truncate">{{ m.teamB.name }}</div>
                <div class="flex items-center justify-end gap-2 pt-1">
                  <div class="flex flex-col gap-1">
                    <button
                      @click="matchStore.changeScore('B', 1, m.matchKey)"
                      class="px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                    >+1</button>
                    <button
                      @click="matchStore.changeScore('B', -1, m.matchKey)"
                      :disabled="m.teamB.score <= 0"
                      class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs disabled:opacity-30"
                    >-1</button>
                  </div>
                  <span class="text-3xl font-black font-display text-white">{{ m.teamB.score }}</span>
                </div>
              </div>
            </div>

            <!-- Action: Open in detail controller -->
            <button
              @click="selectMatchForControl(m)"
              class="w-full py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-black font-bold text-xs transition active:scale-95 text-slate-200"
            >
              Buka Kontrol Penuh Meja Ini &rarr;
            </button>
          </div>
        </div>
      </section>

      <!-- VIEW B: SINGLE MATCH FULL CONTROLLER (Active for Referee or selected by Superadmin) -->
      <section v-else class="space-y-4">
        <!-- Court Switcher Dropdown (If Superadmin) -->
        <div v-if="authStore.user?.role === 'SUPERADMIN'" class="p-3 rounded-xl bg-slate-900 border border-amber-500/40 flex items-center justify-between gap-3">
          <label class="text-xs font-bold text-amber-300 uppercase shrink-0">Pilih Meja Pertandingan:</label>
          <select
            @change="onSwitchCourt($event)"
            :value="matchStore.activeKey"
            class="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none"
          >
            <option v-for="m in matchStore.allMatches" :key="m.matchKey" :value="m.matchKey">
              {{ m.courtName }} &bull; [{{ m.teamA.shortName }} vs {{ m.teamB.shortName }}] (Key: {{ m.matchKey }})
            </option>
          </select>
        </div>

        <!-- KONTROL SKOR UTAMA (TOUCH FRIENDLY) -->
        <ScoreController />

        <!-- PENGATURAN MATCH & TIM PRESET -->
        <MatchConfigForm />

        <!-- SPONSOR & RUNNING TEXT TICKER -->
        <SponsorControl />
      </section>

    </main>

    <!-- FOOTER INFO -->
    <footer class="max-w-6xl mx-auto w-full px-4 text-center text-[11px] text-slate-400 pt-6">
      <p>Esports Broadcast Overlay &bull; Top OBS: <span class="text-amber-400 font-mono">1080 x 150</span> &bull; Bottom OBS (Penutup Hitam Full): <span class="text-cyan-400 font-mono">1920 x 200</span></p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useMatchStore, type MatchData } from "../stores/useMatchStore";
import { useAuthStore } from "../stores/useAuthStore";
import ScoreController from "../components/admin/ScoreController.vue";
import MatchConfigForm from "../components/admin/MatchConfigForm.vue";
import SponsorControl from "../components/admin/SponsorControl.vue";
import { Copy, LogOut, LayoutGrid } from "lucide-vue-next";

const matchStore = useMatchStore();
const authStore = useAuthStore();
const router = useRouter();

const activeView = ref<"dashboard" | "controller">("dashboard");
const toastMessage = ref("");

onMounted(async () => {
  // Fetch assigned match based on logged-in user
  try {
    const res = await fetch("/api/matches/assigned", {
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.role === "SUPERADMIN") {
        matchStore.joinSuperadminRoom();
        if (data.matches && data.matches.length > 0) {
          matchStore.allMatches = data.matches;
          // default active match
          matchStore.match = data.matches[0];
          matchStore.joinMatchRoom(data.matches[0].matchKey);
        }
        activeView.value = "dashboard";
      } else {
        // Referee
        if (data.match) {
          matchStore.match = data.match;
          matchStore.joinMatchRoom(data.match.matchKey);
        }
        activeView.value = "controller";
      }
    }
  } catch (err) {
    console.error("Gagal memuat match wasit:", err);
  }
});

function copyKeyUrl(key: string) {
  const url = `${window.location.origin}/overlay?key=${key}`;
  navigator.clipboard.writeText(url);
  toastMessage.value = `Link Top Overlay untuk [${key}] berhasil disalin!`;
  setTimeout(() => (toastMessage.value = ""), 2500);
}

function copyBottomKeyUrl(key: string) {
  const url = `${window.location.origin}/overlay/bottom?key=${key}`;
  navigator.clipboard.writeText(url);
  toastMessage.value = `Link Bottom Overlay untuk [${key}] berhasil disalin!`;
  setTimeout(() => (toastMessage.value = ""), 2500);
}

function copyActiveOverlayUrl() {
  const key = matchStore.activeKey || matchStore.match?.matchKey;
  if (!key) return;
  copyKeyUrl(key);
}

function copyActiveBottomOverlayUrl() {
  const key = matchStore.activeKey || matchStore.match?.matchKey;
  if (!key) return;
  copyBottomKeyUrl(key);
}

function selectMatchForControl(m: MatchData) {
  matchStore.match = m;
  matchStore.joinMatchRoom(m.matchKey);
  activeView.value = "controller";
}

function onSwitchCourt(e: Event) {
  const key = (e.target as HTMLSelectElement).value;
  const target = matchStore.allMatches.find((m) => m.matchKey === key);
  if (target) {
    matchStore.match = target;
    matchStore.joinMatchRoom(key);
  }
}

function handleLogout() {
  authStore.logout();
  router.push({ name: "login" });
}
</script>
