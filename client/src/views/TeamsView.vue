<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-12">
    <!-- Top Bar -->
    <header class="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div class="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <router-link to="/admin" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
            <ArrowLeft class="w-4 h-4" />
          </router-link>
          <div>
            <h1 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Database Tim Preset
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                {{ teamStore.teams.length }} Tim
              </span>
            </h1>
            <p class="text-[10px] text-slate-400">Kelola daftar tim dan logo untuk dropdown wasit</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Bulk Import GForm Button -->
          <button
            @click="showBulkModal = true"
            class="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition shadow-sm"
            title="Import banyak tim dari Google Form / Excel"
          >
            <FileSpreadsheet class="w-4 h-4" />
            <span>Bulk Import GForm</span>
          </button>

          <!-- Tambah Tim Manual Button -->
          <button
            @click="showCreateModal = true"
            class="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center gap-1.5 active:scale-95 transition shadow-gold-glow"
          >
            <Plus class="w-4 h-4" />
            <span>Tambah Tim</span>
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-5xl mx-auto w-full px-4 pt-4 flex-1 space-y-4">
      <!-- SUB-NAV BAR (NAVIGATION TABS) -->
      <nav class="flex items-center gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold">
        <router-link to="/admin" class="flex-1 py-2 text-center rounded-lg text-slate-300 hover:text-white">
          📊 Monitoring Meja
        </router-link>
        <router-link to="/bracket" class="flex-1 py-2 text-center rounded-lg text-slate-300 hover:text-white">
          🏆 Bagan Turnamen
        </router-link>
        <div class="flex-1 py-2 text-center rounded-lg bg-amber-500 text-black font-black shadow-sm">
          🛡️ Database Tim
        </div>
        <router-link to="/users" class="flex-1 py-2 text-center rounded-lg text-slate-300 hover:text-white">
          👥 Kelola Akun
        </router-link>
      </nav>

      <!-- Search & Filter Bar -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
        <div class="relative flex-1">
          <Search class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari nama atau tag tim..."
            class="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
        <div class="flex items-center gap-2 text-xs text-slate-400 px-1">
          <span>Menampilkan <strong class="text-white">{{ filteredTeams.length }}</strong> dari {{ teamStore.teams.length }} tim</span>
        </div>
      </div>

      <!-- Feedback Alert Banner -->
      <div
        v-if="actionNotification"
        class="p-3 rounded-xl border flex items-center justify-between gap-2 text-xs"
        :class="actionNotification.type === 'success' ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300' : 'bg-amber-950/40 border-amber-700/50 text-amber-300'"
      >
        <div class="flex items-center gap-2">
          <CheckCircle2 v-if="actionNotification.type === 'success'" class="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <AlertCircle v-else class="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{{ actionNotification.message }}</span>
        </div>
        <button @click="actionNotification = null" class="text-slate-400 hover:text-white">
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Loading indicator -->
      <div v-if="teamStore.loading" class="text-center py-12 text-xs text-slate-400">
        <div class="inline-block animate-spin w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full mb-2"></div>
        <p>Memuat database tim...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredTeams.length === 0" class="text-center py-12 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 p-8">
        <p class="text-sm font-bold text-slate-400 mb-1">Tidak ada tim yang cocok</p>
        <p class="text-xs text-slate-600 mb-4">Gunakan tombol "Tambah Tim" atau "Bulk Import GForm" untuk mendaftarkan tim.</p>
        <button
          @click="showBulkModal = true"
          class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-2"
        >
          <FileSpreadsheet class="w-4 h-4" />
          <span>Bulk Import dari GForm</span>
        </button>
      </div>

      <!-- Teams Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div
          v-for="team in filteredTeams"
          :key="team.id"
          class="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-slate-700 hover:shadow-lg transition group"
        >
          <div class="flex items-center gap-3 min-w-0 pr-2">
            <div class="w-10 h-10 rounded-xl bg-slate-950 border border-slate-700 p-1 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img
                v-if="team.logoUrl"
                :src="team.logoUrl"
                :alt="team.name"
                class="w-full h-full object-contain"
                @error="handleImgError"
              />
              <span v-else class="text-xs font-black text-amber-400">
                {{ team.shortName.slice(0, 3) }}
              </span>
            </div>
            <div class="min-w-0">
              <span class="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-800 text-amber-400">
                {{ team.shortName }}
              </span>
              <h3 class="text-xs font-bold text-white mt-0.5 truncate" :title="team.name">{{ team.name }}</h3>
              <p v-if="team.institution" class="text-[10px] text-cyan-300 font-medium truncate mt-0.5 flex items-center gap-1" :title="team.institution">
                <GraduationCap class="w-3 h-3 text-cyan-400 shrink-0" />
                <span class="truncate">{{ team.institution }}</span>
              </p>
            </div>
          </div>

          <!-- Action Buttons: Edit & Delete -->
          <div class="flex items-center gap-1 flex-shrink-0">
            <button
              @click="openEditModal(team)"
              class="p-2 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800 transition"
              title="Edit Tim"
            >
              <Pencil class="w-4 h-4" />
            </button>
            <button
              @click="deleteTeam(team.id, team.name)"
              class="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
              title="Hapus Tim"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- ==================== CREATE TEAM MODAL ==================== -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <Plus class="w-4 h-4 text-amber-400" />
            Tambah Tim Baru
          </h3>
          <button @click="showCreateModal = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleCreateTeam" class="space-y-3.5">
          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Nama Tim Lengkap</label>
            <input
              v-model="newTeamName"
              @input="onNewNameInput"
              type="text"
              required
              placeholder="cth: FNATIC ONIC"
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Asal Sekolah / Instansi (Opsional)</label>
            <input
              v-model="newTeamInstitution"
              type="text"
              placeholder="cth: SMPN 1 KEDIRI / SMKN 2 SURABAYA"
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white uppercase focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-xs font-bold text-slate-300 uppercase">Singkatan / Tag (3-5 Huruf)</label>
              <span class="text-[10px] text-amber-400/80">Otomatis diisi</span>
            </div>
            <input
              v-model="newTeamShort"
              type="text"
              required
              placeholder="cth: ONIC"
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white uppercase focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Upload File Logo (Opsional)</label>
            <input
              @change="onNewFileChange"
              type="file"
              accept="image/*"
              class="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-amber-400 hover:file:bg-slate-700"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Atau Masukkan URL Logo</label>
            <input
              v-model="newTeamLogoUrl"
              type="url"
              placeholder="https://... (jika tidak upload file)"
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div class="pt-3 flex gap-2">
            <button
              type="button"
              @click="showCreateModal = false"
              class="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs shadow-gold-glow"
            >
              {{ saving ? 'Menyimpan...' : 'Simpan Tim' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ==================== EDIT TEAM MODAL ==================== -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <h3 class="text-sm font-bold text-white flex items-center gap-2">
            <Pencil class="w-4 h-4 text-amber-400" />
            Edit Data Tim
          </h3>
          <button @click="showEditModal = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleUpdateTeam" class="space-y-3.5">
          <!-- Logo Current Preview -->
          <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div class="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 p-1 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                v-if="editTeamLogoUrl"
                :src="editTeamLogoUrl"
                class="w-full h-full object-contain"
                alt="Logo Preview"
              />
              <span v-else class="text-xs font-black text-amber-400">
                {{ editTeamShort ? editTeamShort.slice(0, 3) : 'LOGO' }}
              </span>
            </div>
            <div>
              <p class="text-xs font-bold text-white">{{ editTeamName || 'Nama Tim' }}</p>
              <p class="text-[10px] text-slate-400">Preview logo saat ini</p>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Nama Tim Lengkap</label>
            <input
              v-model="editTeamName"
              type="text"
              required
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Asal Sekolah / Instansi (Opsional)</label>
            <input
              v-model="editTeamInstitution"
              type="text"
              placeholder="cth: SMPN 1 KEDIRI / SMKN 2 SURABAYA"
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white uppercase focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Singkatan / Tag (3-5 Huruf)</label>
            <input
              v-model="editTeamShort"
              type="text"
              required
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white uppercase focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Ganti File Logo (Opsional)</label>
            <input
              @change="onEditFileChange"
              type="file"
              accept="image/*"
              class="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-amber-400 hover:file:bg-slate-700"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-300 uppercase mb-1">Atau Ubah URL Logo</label>
            <input
              v-model="editTeamLogoUrl"
              type="url"
              placeholder="https://..."
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div class="pt-3 flex gap-2">
            <button
              type="button"
              @click="showEditModal = false"
              class="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs shadow-gold-glow"
            >
              {{ saving ? 'Menyimpan...' : 'Perbarui Tim' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ==================== BULK UPLOAD MODAL (GFORM / EXCEL) ==================== -->
    <div
      v-if="showBulkModal"
      class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl flex flex-col max-h-[90vh]">
        <!-- Modal Header -->
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm font-bold text-white">Bulk Import Tim dari Google Form / Excel</h3>
              <p class="text-[11px] text-slate-400">Copy-paste langsung kolom pendaftaran tim dari Google Spreadsheet</p>
            </div>
          </div>
          <button @click="showBulkModal = false" class="text-slate-400 hover:text-white">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="overflow-y-auto space-y-4 py-4 pr-1">
          <!-- Guide / Tips -->
          <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <div class="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] uppercase tracking-wide">
              <Sparkles class="w-3.5 h-3.5" />
              <span>Cara Penggunaan Cepat:</span>
            </div>
            <ul class="list-disc list-inside text-[11px] text-slate-400 space-y-0.5">
              <li>Buka spreadsheet Google Form Anda, blok & salin kolom <strong>"Nama Tim"</strong> dan kolom <strong>"Asal Sekolah / Instansi"</strong>.</li>
              <li>Paste di kotak teks di bawah. Sistem otomatis mendeteksi 2 kolom (Kolom 1 = Nama Tim, Kolom 2 = Asal Sekolah) dan tag dibuat otomatis!</li>
              <li>Format didukung: <code class="text-amber-300">Nama Tim</code> saja, atau <code class="text-amber-300">Nama Tim [TAB] Asal Sekolah</code>, atau <code class="text-amber-300">Nama Tim [TAB] Tag [TAB] Asal Sekolah</code>.</li>
              <li>Tim yang sudah terdaftar di database akan <strong>otomatis dilewati</strong> (anti duplikat).</li>
            </ul>
          </div>

          <!-- File Upload helper -->
          <div class="flex items-center justify-between text-xs">
            <label class="font-bold text-slate-300 uppercase">Input Teks Tim:</label>
            <label class="text-[11px] text-emerald-400 hover:text-emerald-300 cursor-pointer flex items-center gap-1 font-semibold">
              <Upload class="w-3.5 h-3.5" />
              <span>Upload file .csv / .txt</span>
              <input type="file" accept=".csv,.txt" class="hidden" @change="handleBulkFileUpload" />
            </label>
          </div>

          <!-- Textarea Input -->
          <textarea
            v-model="bulkText"
            rows="6"
            placeholder="Tempel kolom pendaftaran dari Google Spreadsheet di sini... Contoh:
SQUAD NAGA HITAM	SMPN 1 KEDIRI
ALTER EGO	SMPN 2 MALANG
BIGETRON ALPHA	SMPN 3 SURABAYA
EVOS GLORY	MTSN 1 KEDIRI
KRAKEN ESPORTS	SMP BHAKTI"
            class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
          ></textarea>

          <!-- Live Preview Section -->
          <div v-if="parsedBulkTeams.length > 0" class="space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-slate-300 flex items-center gap-1.5">
                <CheckCircle2 class="w-4 h-4 text-emerald-400" />
                Terdeteksi {{ parsedBulkTeams.length }} Tim Siap Di-import
              </span>
              <span class="text-[10px] text-slate-400">
                (Preview 10 tim pertama)
              </span>
            </div>

            <div class="max-h-52 overflow-y-auto rounded-xl bg-slate-950 border border-slate-800 divide-y divide-slate-800/60">
              <div
                v-for="(item, idx) in parsedBulkTeams.slice(0, 10)"
                :key="idx"
                class="px-3 py-2 flex items-center justify-between text-xs gap-3"
              >
                <div class="flex items-center gap-2 truncate min-w-0">
                  <span class="text-[10px] text-slate-500 font-mono w-5 shrink-0">{{ idx + 1 }}.</span>
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5 truncate">
                      <p class="font-bold text-white truncate">{{ item.name }}</p>
                      <span
                        v-if="item.isNameAdjusted"
                        class="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold shrink-0"
                        title="Nama tim otomatis disesuaikan karena terdapat nama yang sama dari instansi lain"
                      >
                        ⚠️ Nama Disesuaikan
                      </span>
                    </div>
                    <p v-if="item.institution" class="text-[10px] text-cyan-300 truncate flex items-center gap-1 font-medium">
                      <GraduationCap class="w-3 h-3 text-cyan-400 shrink-0" />
                      <span class="truncate">{{ item.institution }}</span>
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-1.5 flex-shrink-0">
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-mono font-bold">
                    {{ item.shortName }}
                  </span>
                  <span v-if="item.isAutoTag" class="text-[9px] text-slate-500 italic">auto</span>
                </div>
              </div>
            </div>

            <p v-if="parsedBulkTeams.length > 10" class="text-[10px] text-center text-slate-500 italic">
              ... dan {{ parsedBulkTeams.length - 10 }} tim lainnya
            </p>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            @click="clearBulkForm"
            class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
          >
            Bersihkan
          </button>

          <div class="flex gap-2">
            <button
              type="button"
              @click="showBulkModal = false"
              class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Batal
            </button>
            <button
              type="button"
              :disabled="saving || parsedBulkTeams.length === 0"
              @click="handleBulkSubmit"
              class="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
            >
              <FileSpreadsheet class="w-4 h-4" />
              <span>{{ saving ? 'Mengimpor...' : `Import ${parsedBulkTeams.length} Tim` }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useTeamStore, type Team } from "../stores/useTeamStore";
import { useAuthStore } from "../stores/useAuthStore";
import {
  ArrowLeft,
  Plus,
  Trash2,
  X,
  Pencil,
  FileSpreadsheet,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  GraduationCap,
} from "lucide-vue-next";

const teamStore = useTeamStore();
const authStore = useAuthStore();

// Search & Notification
const searchQuery = ref("");
const actionNotification = ref<{ type: "success" | "warning"; message: string } | null>(null);

// Create Modal States
const showCreateModal = ref(false);
const newTeamName = ref("");
const newTeamShort = ref("");
const newTeamInstitution = ref("");
const newTeamLogoUrl = ref("");
const selectedNewFile = ref<File | null>(null);

// Edit Modal States
const showEditModal = ref(false);
const editTeamId = ref("");
const editTeamName = ref("");
const editTeamShort = ref("");
const editTeamInstitution = ref("");
const editTeamLogoUrl = ref("");
const selectedEditFile = ref<File | null>(null);

// Bulk Modal States
const showBulkModal = ref(false);
const bulkText = ref("");

const saving = ref(false);

onMounted(() => {
  teamStore.fetchTeams();
});

// Filtered teams list based on search
const filteredTeams = computed(() => {
  if (!searchQuery.value.trim()) return teamStore.teams;
  const q = searchQuery.value.toLowerCase().trim();
  return teamStore.teams.filter(
    (t) => t.name.toLowerCase().includes(q) || t.shortName.toLowerCase().includes(q)
  );
});

// Auto-generate tag logic for frontend preview & quick fill
function generateTag(name: string): string {
  const cleaned = name.trim().toUpperCase();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 3) {
    return words.slice(0, 4).map((w) => w[0]).join("");
  } else if (words.length === 2) {
    if (words[0].length >= 2 && words[1].length >= 2) {
      return (words[0][0] + words[1].slice(0, 2)).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  } else {
    return cleaned.slice(0, 4);
  }
}

function onNewNameInput() {
  if (!newTeamShort.value || newTeamShort.value.length <= 4) {
    newTeamShort.value = generateTag(newTeamName.value);
  }
}

function onNewFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (files && files[0]) {
    selectedNewFile.value = files[0];
  }
}

function onEditFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (files && files[0]) {
    selectedEditFile.value = files[0];
    // Create preview URL
    editTeamLogoUrl.value = URL.createObjectURL(files[0]);
  }
}

function handleImgError(e: Event) {
  const target = e.target as HTMLImageElement;
  target.style.display = "none";
}

// ---------------- CREATE TEAM ----------------
async function handleCreateTeam() {
  saving.value = true;
  try {
    const formData = new FormData();
    formData.append("name", newTeamName.value);
    formData.append("shortName", newTeamShort.value);
    if (newTeamInstitution.value) formData.append("institution", newTeamInstitution.value);
    if (newTeamLogoUrl.value) formData.append("logoUrl", newTeamLogoUrl.value);
    if (selectedNewFile.value) formData.append("logo", selectedNewFile.value);

    await teamStore.createTeam(formData);
    showCreateModal.value = false;
    actionNotification.value = {
      type: "success",
      message: `Tim "${newTeamName.value}" berhasil ditambahkan!`,
    };

    newTeamName.value = "";
    newTeamShort.value = "";
    newTeamInstitution.value = "";
    newTeamLogoUrl.value = "";
    selectedNewFile.value = null;
  } catch (err: any) {
    alert(err.message || "Gagal membuat tim.");
  } finally {
    saving.value = false;
  }
}

// ---------------- EDIT TEAM ----------------
function openEditModal(team: Team) {
  editTeamId.value = team.id;
  editTeamName.value = team.name;
  editTeamShort.value = team.shortName;
  editTeamInstitution.value = team.institution || "";
  editTeamLogoUrl.value = team.logoUrl || "";
  selectedEditFile.value = null;
  showEditModal.value = true;
}

async function handleUpdateTeam() {
  if (!editTeamId.value) return;
  saving.value = true;
  try {
    const formData = new FormData();
    formData.append("name", editTeamName.value);
    formData.append("shortName", editTeamShort.value);
    formData.append("institution", editTeamInstitution.value || "");
    if (editTeamLogoUrl.value) formData.append("logoUrl", editTeamLogoUrl.value);
    if (selectedEditFile.value) formData.append("logo", selectedEditFile.value);

    await teamStore.updateTeam(editTeamId.value, formData);
    showEditModal.value = false;
    actionNotification.value = {
      type: "success",
      message: `Perubahan data tim "${editTeamName.value}" berhasil disimpan!`,
    };
  } catch (err: any) {
    alert(err.message || "Gagal memperbarui tim.");
  } finally {
    saving.value = false;
  }
}

// ---------------- DELETE TEAM ----------------
async function deleteTeam(id: string, name: string) {
  if (!confirm(`Yakin ingin menghapus tim "${name}" dari database?`)) return;
  try {
    const res = await fetch(`/api/teams/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    if (res.ok) {
      teamStore.teams = teamStore.teams.filter((t) => t.id !== id);
      actionNotification.value = {
        type: "success",
        message: `Tim "${name}" telah dihapus.`,
      };
    }
  } catch (err) {
    console.error("Gagal menghapus:", err);
  }
}

// ---------------- BULK UPLOAD PARSING & ACTIONS ----------------
const parsedBulkTeams = computed(() => {
  if (!bulkText.value.trim()) return [];

  const lines = bulkText.value.split(/\r?\n/);
  const rawList: Array<{ name: string; shortName: string; institution?: string | null; isAutoTag: boolean }> = [];
  const seenExact = new Set<string>();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    let name = "";
    let shortName = "";
    let institution = "";
    let isAutoTag = false;

    if (line.includes("\t") || line.includes(",")) {
      const delimiter = line.includes("\t") ? "\t" : ",";
      const parts = line.split(delimiter).map((p) => p.trim()).filter(Boolean);

      if (parts.length >= 3) {
        // Format 3 kolom: Nama Tim [TAB] Tag [TAB] Asal Sekolah
        name = parts[0] || "";
        // Jika kolom 2 panjang (>5 huruf), kemungkinan itu nama sekolah dan kolom 3 adalah tag
        if (parts[1].length <= 5) {
          shortName = parts[1];
          institution = parts[2];
        } else {
          institution = parts[1];
          shortName = parts[2];
        }
      } else if (parts.length === 2) {
        // Format 2 kolom (Umum dari GForm): Nama Tim [TAB] Asal Sekolah
        name = parts[0] || "";
        // Jika kolom 2 sangat pendek (<= 4 huruf kapital), treat as tag
        if (parts[1].length <= 4 && parts[1] === parts[1].toUpperCase()) {
          shortName = parts[1];
        } else {
          institution = parts[1];
        }
      } else {
        name = parts[0] || "";
      }
    } else {
      name = line;
    }

    if (!name) continue;

    // Bersihkan penomoran di depan nama jika di-copy dari list (cth: "1. ", "1)")
    name = name.replace(/^\d+[\.\)\-]\s*/, "").trim();
    if (!name) continue;

    const instTrimmed = institution ? institution.trim() : null;
    const exactKey = `${name.toUpperCase()}___${(instTrimmed || "").toUpperCase()}`;

    // Lewati jika duplikat persis di dalam teks input
    if (seenExact.has(exactKey)) continue;
    seenExact.add(exactKey);

    // Auto tag jika tidak ada
    if (!shortName) {
      shortName = generateTag(name);
      isAutoTag = true;
    } else {
      shortName = shortName.toUpperCase().slice(0, 5);
    }

    rawList.push({
      name,
      shortName,
      institution: instTrimmed,
      isAutoTag,
    });
  }

  // Hitung frekuensi nama tim di batch input
  const nameCounts = new Map<string, number>();
  for (const item of rawList) {
    const k = item.name.toUpperCase();
    nameCounts.set(k, (nameCounts.get(k) || 0) + 1);
  }

  // Nama tim yang sudah ada di database saat ini
  const dbExistingNames = new Set(teamStore.teams.map((t) => t.name.toUpperCase()));

  // Kembalikan daftar tim dengan penyesuaian nama otomatis jika terjadi tabrakan nama beda sekolah
  return rawList.map((item) => {
    const upper = item.name.toUpperCase();
    const hasBatchCollision = (nameCounts.get(upper) || 0) > 1;
    const hasDbCollision = dbExistingNames.has(upper);

    let finalName = item.name;
    let isNameAdjusted = false;

    if (item.institution && (hasBatchCollision || hasDbCollision)) {
      const instSuffix = `(${item.institution})`;
      if (!item.name.toLowerCase().endsWith(instSuffix.toLowerCase())) {
        finalName = `${item.name} (${item.institution})`;
        isNameAdjusted = true;
      }
    }

    return {
      ...item,
      name: finalName,
      isNameAdjusted,
    };
  });
});

function handleBulkFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const content = event.target?.result as string;
    if (content) {
      bulkText.value = content;
    }
  };
  reader.readAsText(file);
}

function clearBulkForm() {
  bulkText.value = "";
}

async function handleBulkSubmit() {
  if (parsedBulkTeams.value.length === 0) return;
  saving.value = true;
  try {
    const payload = parsedBulkTeams.value.map((t) => ({
      name: t.name,
      shortName: t.shortName,
      institution: t.institution || null,
    }));

    const result = await teamStore.bulkCreateTeams(payload);
    showBulkModal.value = false;
    bulkText.value = "";

    actionNotification.value = {
      type: "success",
      message: result.message || `Berhasil mengimpor ${result.addedCount} tim baru!`,
    };
  } catch (err: any) {
    alert(err.message || "Gagal melakukan bulk import tim.");
  } finally {
    saving.value = false;
  }
}
</script>
