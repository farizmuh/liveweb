<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-12 select-none">
    
    <!-- HEADER BAR -->
    <header class="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div class="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <router-link to="/admin" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
            <ArrowLeft class="w-4 h-4" />
          </router-link>
          <div>
            <h1 class="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>Kelola Akun & Password</span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold">
                {{ userStore.users.length }} Akun
              </span>
            </h1>
            <p class="text-[11px] text-slate-400">Manipulasi username, nama, dan password untuk Admin serta Petugas Wasit</p>
          </div>
        </div>

        <!-- Tombol Tambah Akun Baru -->
        <div class="flex items-center gap-2">
          <button
            @click="openCreateModal"
            class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black text-xs flex items-center gap-2 active:scale-95 transition shadow-gold-glow"
          >
            <UserPlus class="w-4 h-4 text-black" />
            <span>Tambah Akun Baru</span>
          </button>
        </div>
      </div>
    </header>

    <!-- MAIN BODY -->
    <main class="max-w-6xl mx-auto w-full px-4 pt-4 flex-1 space-y-4">

      <!-- NAVIGATION TABS -->
      <nav class="flex items-center gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold overflow-x-auto">
        <router-link
          to="/admin"
          class="flex-1 min-w-[130px] py-2 text-center rounded-lg text-slate-300 hover:text-white transition"
        >
          📊 Monitoring Meja
        </router-link>
        <router-link
          to="/bracket"
          class="flex-1 min-w-[130px] py-2 text-center rounded-lg text-slate-300 hover:text-white transition"
        >
          🏆 Bagan Turnamen
        </router-link>
        <router-link
          to="/teams"
          class="flex-1 min-w-[130px] py-2 text-center rounded-lg text-slate-300 hover:text-white transition"
        >
          🛡️ Database Tim
        </router-link>
        <div
          class="flex-1 min-w-[160px] py-2 text-center rounded-lg bg-amber-500 text-black font-black shadow"
        >
          👥 Kelola Akun & Petugas
        </div>
      </nav>

      <!-- SEARCH & FILTER BAR -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
        <div class="relative flex-1">
          <Search class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari username atau nama petugas..."
            class="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
        <div class="flex items-center gap-3 text-xs text-slate-400 px-1">
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>Superadmin: {{ superadminCount }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span>Wasit: {{ refereeCount }}</span>
          </div>
        </div>
      </div>

      <!-- NOTIFICATION ALERT -->
      <div
        v-if="notification"
        class="p-3 rounded-xl border flex items-center justify-between gap-2 text-xs transition"
        :class="notification.type === 'success' ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300' : 'bg-red-950/40 border-red-700/50 text-red-300'"
      >
        <div class="flex items-center gap-2">
          <CheckCircle2 v-if="notification.type === 'success'" class="w-4 h-4 text-emerald-400 shrink-0" />
          <AlertCircle v-else class="w-4 h-4 text-red-400 shrink-0" />
          <span class="font-bold">{{ notification.message }}</span>
        </div>
        <button @click="notification = null" class="text-slate-400 hover:text-white">
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- LOADING INDICATOR -->
      <div v-if="userStore.loading" class="text-center py-12 text-xs text-slate-400">
        <div class="inline-block animate-spin w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full mb-2"></div>
        <p>Memuat data pengguna...</p>
      </div>

      <!-- USERS GRID CARDS -->
      <div v-else-if="filteredUsers.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="u in filteredUsers"
          :key="u.id"
          class="rounded-2xl p-4.5 bg-slate-900 border transition shadow-lg relative overflow-hidden flex flex-col justify-between"
          :class="[
            u.role === 'SUPERADMIN' ? 'border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-900' : 'border-slate-800 hover:border-slate-700',
            isCurrentUser(u.id) ? 'ring-2 ring-amber-400/60' : ''
          ]"
        >
          <!-- Top Card: Role Badge & Current User Tag -->
          <div>
            <div class="flex items-center justify-between pb-3 border-b border-slate-850">
              <span
                class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                :class="u.role === 'SUPERADMIN' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'"
              >
                <Crown v-if="u.role === 'SUPERADMIN'" class="w-3 h-3 text-amber-400" />
                <Shield v-else class="w-3 h-3 text-cyan-400" />
                <span>{{ u.role === 'SUPERADMIN' ? 'SUPERADMIN' : 'PETUGAS WASIT' }}</span>
              </span>

              <span v-if="isCurrentUser(u.id)" class="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Akun Anda Saat Ini
              </span>
            </div>

            <!-- User Info: Avatar, Name & Username -->
            <div class="flex items-center gap-3 pt-3.5 pb-2">
              <div
                class="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shrink-0 shadow"
                :class="u.role === 'SUPERADMIN' ? 'bg-gradient-to-tr from-amber-600 to-amber-400 text-black' : 'bg-gradient-to-tr from-cyan-600 to-blue-500 text-white'"
              >
                {{ u.name.slice(0, 2).toUpperCase() }}
              </div>
              <div class="min-w-0 flex-1">
                <h3 class="text-sm font-black text-white truncate leading-tight">{{ u.name }}</h3>
                <div class="flex items-center gap-1.5 text-xs font-mono text-slate-400 mt-0.5">
                  <span class="text-amber-400 font-bold">@</span>
                  <span class="truncate">{{ u.username }}</span>
                </div>
                
                <!-- Assigned Court Badge -->
                <div v-if="u.role === 'REFEREE'" class="mt-2 flex items-center gap-1.5">
                  <span
                    v-if="u.assignedMatches && u.assignedMatches.length > 0"
                    class="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-500/20 text-cyan-300 border border-blue-500/40 flex items-center gap-1"
                  >
                    <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    <span>Tugas: {{ u.assignedMatches[0].courtName }}</span>
                  </span>
                  <span
                    v-else
                    class="text-[10px] text-slate-500 italic"
                  >
                    Menyiapkan Meja...
                  </span>
                </div>
                <div v-else class="mt-2 flex items-center gap-1.5">
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300/80 border border-amber-500/20">
                    Akses Semua Meja & Bagan
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons Bar -->
          <div class="pt-3 mt-2 border-t border-slate-800/80 flex items-center gap-2">
            <!-- Tombol Ganti Password Cepat -->
            <button
              @click="openPasswordModal(u)"
              class="flex-1 py-1.5 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
              title="Ganti password untuk akun ini"
            >
              <KeyRound class="w-3.5 h-3.5 text-amber-400" />
              <span>Ganti Password</span>
            </button>

            <!-- Tombol Edit Akun (Username & Nama) -->
            <button
              @click="openEditModal(u)"
              class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition active:scale-95"
              title="Edit username, nama, atau role"
            >
              <Pencil class="w-3.5 h-3.5" />
            </button>

            <!-- Tombol Hapus Akun -->
            <button
              @click="handleDelete(u)"
              :disabled="isCurrentUser(u.id)"
              class="p-2 rounded-xl bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/40 transition active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
              :title="isCurrentUser(u.id) ? 'Tidak dapat menghapus akun Anda sendiri' : 'Hapus akun pengguna ini'"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- EMPTY STATE -->
      <div v-else class="text-center py-16 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800 p-6">
        <Users class="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 class="text-sm font-bold text-slate-300">Tidak ada akun yang cocok</h3>
        <p class="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian Anda.</p>
      </div>

    </main>

    <!-- ========================================================== -->
    <!-- 1. MODAL TAMBAH AKUN BARU                                  -->
    <!-- ========================================================== -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <UserPlus class="w-5 h-5 text-amber-400" />
            <h2 class="text-base font-black text-white uppercase tracking-wider">Tambah Akun Baru</h2>
          </div>
          <button @click="showCreateModal = false" class="text-slate-400 hover:text-white p-1">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleCreateUser" class="space-y-3.5 text-xs">
          <div>
            <label class="block font-bold text-slate-300 mb-1">Username Login *</label>
            <input
              v-model="createForm.username"
              type="text"
              required
              placeholder="cth: wasit5 atau juri1"
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-400"
            />
            <span class="text-[10px] text-slate-500">Huruf kecil, tanpa spasi, minimal 3 karakter</span>
          </div>

          <div>
            <label class="block font-bold text-slate-300 mb-1">Nama Lengkap Petugas *</label>
            <input
              v-model="createForm.name"
              type="text"
              required
              placeholder="cth: Wasit Meja 5"
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label class="block font-bold text-slate-300 mb-1">Role / Peran *</label>
            <select
              v-model="createForm.role"
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400 font-bold"
            >
              <option value="REFEREE">🎮 Petugas Wasit (Hanya kelola meja tugasnya)</option>
              <option value="SUPERADMIN">👑 Superadmin (Akses penuh semua meja, bagan, & akun)</option>
            </select>
          </div>

          <div>
            <label class="block font-bold text-slate-300 mb-1">Password Baru *</label>
            <div class="relative">
              <input
                v-model="createForm.password"
                :type="showCreatePassword ? 'text' : 'password'"
                required
                minlength="4"
                placeholder="Minimal 4 karakter"
                class="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                @click="showCreatePassword = !showCreatePassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <EyeOff v-if="showCreatePassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div class="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              @click="showCreateModal = false"
              class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="actionLoading"
              class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 shadow-gold-glow"
            >
              <Check class="w-4 h-4" />
              <span>Simpan Akun</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- 2. MODAL EDIT DETAIL AKUN (USERNAME & NAMA)                -->
    <!-- ========================================================== -->
    <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <Pencil class="w-5 h-5 text-amber-400" />
            <h2 class="text-base font-black text-white uppercase tracking-wider">Edit Detail Akun</h2>
          </div>
          <button @click="showEditModal = false" class="text-slate-400 hover:text-white p-1">
            <X class="w-5 h-5" />
          </button>
        </div>

        <form @submit.prevent="handleUpdateUser" class="space-y-3.5 text-xs">
          <div>
            <label class="block font-bold text-slate-300 mb-1">Username Login *</label>
            <input
              v-model="editForm.username"
              type="text"
              required
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label class="block font-bold text-slate-300 mb-1">Nama Lengkap *</label>
            <input
              v-model="editForm.name"
              type="text"
              required
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label class="block font-bold text-slate-300 mb-1">Role / Peran *</label>
            <select
              v-model="editForm.role"
              :disabled="isCurrentUser(selectedUserId)"
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400 font-bold disabled:opacity-40"
            >
              <option value="REFEREE">🎮 Petugas Wasit</option>
              <option value="SUPERADMIN">👑 Superadmin</option>
            </select>
            <span v-if="isCurrentUser(selectedUserId)" class="text-[10px] text-amber-400/80 mt-1 block">
              Role akun Anda sendiri tidak dapat diubah
            </span>
          </div>

          <div>
            <label class="block font-bold text-slate-300 mb-1">Password Baru (Opsional)</label>
            <input
              v-model="editForm.password"
              type="text"
              placeholder="Kosongkan jika tidak ingin mengganti password"
              class="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-amber-400"
            />
          </div>

          <div class="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              @click="showEditModal = false"
              class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="actionLoading"
              class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 shadow-gold-glow"
            >
              <Check class="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ========================================================== -->
    <!-- 3. MODAL GANTI PASSWORD CEPAT                              -->
    <!-- ========================================================== -->
    <div v-if="showPasswordModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between pb-2 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <KeyRound class="w-5 h-5 text-amber-400" />
            <h2 class="text-base font-black text-white uppercase tracking-wider">Ganti Password</h2>
          </div>
          <button @click="showPasswordModal = false" class="text-slate-400 hover:text-white p-1">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="p-3 rounded-xl bg-black/40 border border-slate-800 text-xs flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center font-black">
            {{ selectedUserName.slice(0, 2).toUpperCase() }}
          </div>
          <div>
            <div class="font-bold text-white">{{ selectedUserName }}</div>
            <div class="text-[11px] font-mono text-slate-400">@{{ selectedUserUsername }}</div>
          </div>
        </div>

        <form @submit.prevent="handleQuickPasswordChange" class="space-y-3.5 text-xs">
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="font-bold text-slate-300">Password Baru *</label>
              <button
                type="button"
                @click="generateRandomPassword"
                class="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <Shuffle class="w-3 h-3" />
                <span>Acak Password</span>
              </button>
            </div>
            
            <div class="relative">
              <input
                v-model="quickPassword"
                :type="showQuickPassword ? 'text' : 'password'"
                required
                minlength="4"
                placeholder="Masukkan password baru..."
                class="w-full pl-3 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                @click="showQuickPassword = !showQuickPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <EyeOff v-if="showQuickPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div class="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              @click="showPasswordModal = false"
              class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              :disabled="actionLoading || !quickPassword"
              class="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 shadow-gold-glow"
            >
              <Check class="w-4 h-4" />
              <span>Perbarui Password</span>
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../stores/useAuthStore";
import { useUserStore, type ManagedUser } from "../stores/useUserStore";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Crown,
  Shield,
  KeyRound,
  Pencil,
  Trash2,
  Search,
  Check,
  X,
  Eye,
  EyeOff,
  Shuffle,
  CheckCircle2,
  AlertCircle,
} from "lucide-vue-next";

const authStore = useAuthStore();
const userStore = useUserStore();

const searchQuery = ref("");
const actionLoading = ref(false);
const notification = ref<{ message: string; type: "success" | "error" } | null>(null);

// Modal States
const showCreateModal = ref(false);
const showCreatePassword = ref(false);
const createForm = ref({
  username: "",
  name: "",
  role: "REFEREE",
  password: "",
});

const showEditModal = ref(false);
const selectedUserId = ref("");
const editForm = ref({
  username: "",
  name: "",
  role: "REFEREE",
  password: "",
});

const showPasswordModal = ref(false);
const selectedUserName = ref("");
const selectedUserUsername = ref("");
const quickPassword = ref("");
const showQuickPassword = ref(true);

onMounted(async () => {
  try {
    await userStore.fetchUsers();
  } catch (err: any) {
    showNotification(err.message || "Gagal memuat pengguna.", "error");
  }
});

function isCurrentUser(userId: string): boolean {
  return authStore.user?.id === userId;
}

const filteredUsers = computed(() => {
  if (!searchQuery.value) return userStore.users;
  const q = searchQuery.value.toLowerCase().trim();
  return userStore.users.filter(
    (u) => u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
  );
});

const superadminCount = computed(() => {
  return userStore.users.filter((u) => u.role === "SUPERADMIN").length;
});

const refereeCount = computed(() => {
  return userStore.users.filter((u) => u.role === "REFEREE").length;
});

function showNotification(message: string, type: "success" | "error") {
  notification.value = { message, type };
  setTimeout(() => {
    if (notification.value?.message === message) {
      notification.value = null;
    }
  }, 3500);
}

// 1. Tambah Akun
function openCreateModal() {
  createForm.value = {
    username: "",
    name: "",
    role: "REFEREE",
    password: "",
  };
  showCreatePassword.value = false;
  showCreateModal.value = true;
}

async function handleCreateUser() {
  actionLoading.value = true;
  try {
    const res = await userStore.createUser(createForm.value);
    showCreateModal.value = false;
    showNotification(res.message || "Akun baru berhasil dibuat!", "success");
  } catch (err: any) {
    showNotification(err.message || "Gagal membuat akun.", "error");
  } finally {
    actionLoading.value = false;
  }
}

// 2. Edit Akun
function openEditModal(user: ManagedUser) {
  selectedUserId.value = user.id;
  editForm.value = {
    username: user.username,
    name: user.name,
    role: user.role,
    password: "",
  };
  showEditModal.value = true;
}

async function handleUpdateUser() {
  if (!selectedUserId.value) return;
  actionLoading.value = true;
  try {
    const payload: any = {
      username: editForm.value.username,
      name: editForm.value.name,
      role: editForm.value.role,
    };
    if (editForm.value.password.trim()) {
      payload.password = editForm.value.password.trim();
    }
    const res = await userStore.updateUser(selectedUserId.value, payload);
    showEditModal.value = false;
    showNotification(res.message || "Detail akun berhasil diperbarui!", "success");
  } catch (err: any) {
    showNotification(err.message || "Gagal memperbarui akun.", "error");
  } finally {
    actionLoading.value = false;
  }
}

// 3. Ganti Password Cepat
function openPasswordModal(user: ManagedUser) {
  selectedUserId.value = user.id;
  selectedUserName.value = user.name;
  selectedUserUsername.value = user.username;
  quickPassword.value = "";
  showQuickPassword.value = true;
  showPasswordModal.value = true;
}

function generateRandomPassword() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let pwd = "";
  for (let i = 0; i < 6; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  quickPassword.value = pwd;
}

async function handleQuickPasswordChange() {
  if (!selectedUserId.value || !quickPassword.value) return;
  actionLoading.value = true;
  try {
    const res = await userStore.updateUser(selectedUserId.value, {
      password: quickPassword.value,
    });
    showPasswordModal.value = false;
    showNotification(res.message || `Password untuk @${selectedUserUsername.value} berhasil diubah!`, "success");
  } catch (err: any) {
    showNotification(err.message || "Gagal mengubah password.", "error");
  } finally {
    actionLoading.value = false;
  }
}

// 4. Hapus Akun
async function handleDelete(user: ManagedUser) {
  if (isCurrentUser(user.id)) {
    alert("Anda tidak dapat menghapus akun Anda sendiri.");
    return;
  }
  if (!confirm(`Hapus akun "${user.username}" (${user.name}) secara permanen?`)) {
    return;
  }

  try {
    const res = await userStore.deleteUser(user.id);
    showNotification(res.message || "Akun berhasil dihapus.", "success");
  } catch (err: any) {
    showNotification(err.message || "Gagal menghapus akun.", "error");
  }
}
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.97);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
