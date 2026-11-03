<template>
  <div class="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-black relative overflow-hidden">
    <!-- Ambient Glow Background -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none"></div>

    <div class="w-full max-w-md rounded-3xl metallic-card p-8 border border-amber-500/40 shadow-2xl relative z-10">
      
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-black font-black text-2xl shadow-gold-glow">
          MLBB
        </div>
        <h1 class="text-2xl font-black uppercase tracking-wider text-white font-display">
          Control Panel Wasit
        </h1>
        <p class="text-xs text-slate-400 font-semibold mt-1">
          Masuk untuk mengendalikan skor & overlay turnamen
        </p>
      </div>

      <!-- Error Alert -->
      <div
        v-if="errorMessage"
        class="mb-5 p-3 rounded-xl bg-red-950/80 border border-red-700/80 text-xs font-semibold text-red-200"
      >
        {{ errorMessage }}
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            Username
          </label>
          <input
            v-model="username"
            type="text"
            required
            autocomplete="username"
            placeholder="Masukkan username panitia"
            class="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white focus:border-amber-400 focus:outline-none transition"
          />
        </div>

        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            Password
          </label>
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            placeholder="Masukkan password"
            class="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white focus:border-amber-400 focus:outline-none transition"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black text-sm uppercase tracking-wider shadow-gold-glow active:scale-95 transition disabled:opacity-50"
        >
          <span v-if="loading">Memeriksa Kredensial...</span>
          <span v-else>Masuk ke Panel Kontrol</span>
        </button>
      </form>

      <div class="mt-6 pt-5 border-t border-slate-800 text-center space-y-1">
        <p class="text-[11px] text-slate-400 font-medium">
          Akun Superadmin: <span class="text-amber-400 font-mono">admin</span> / <span class="text-amber-400 font-mono">admin123</span>
        </p>
        <p class="text-[10px] text-slate-400">
          Akun Wasit Meja 1 - 4: <span class="text-blue-400 font-mono">wasit1</span> s/d <span class="text-blue-400 font-mono">wasit4</span> (Password: <span class="text-blue-400 font-mono">wasit123</span>)
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/useAuthStore";

const authStore = useAuthStore();
const router = useRouter();

const username = ref("");
const password = ref("");
const errorMessage = ref("");
const loading = ref(false);

async function handleLogin() {
  errorMessage.value = "";
  loading.value = true;
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Gagal login. Periksa username dan password.");
    }

    authStore.setAuth(data.token, data.user);
    router.push({ name: "admin" });
  } catch (err: any) {
    errorMessage.value = err.message || "Terjadi kesalahan saat login.";
  } finally {
    loading.value = false;
  }
}
</script>

