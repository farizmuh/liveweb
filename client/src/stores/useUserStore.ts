import { defineStore } from "pinia";
import { ref } from "vue";
import { useAuthStore } from "./useAuthStore";

export interface ManagedUser {
  id: string;
  username: string;
  name: string;
  role: "SUPERADMIN" | "REFEREE";
  createdAt: string;
  updatedAt?: string;
  assignedMatches?: Array<{
    id: string;
    courtName: string;
    matchKey: string;
  }>;
  _count?: {
    assignedMatches: number;
  };
}

export const useUserStore = defineStore("user", () => {
  const users = ref<ManagedUser[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchUsers() {
    loading.value = true;
    error.value = null;
    const authStore = useAuthStore();
    try {
      const res = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${authStore.token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengambil daftar pengguna.");
      users.value = data.users || [];
      return users.value;
    } catch (err: any) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createUser(payload: { username: string; password: string; name: string; role: string }) {
    const authStore = useAuthStore();
    const res = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal membuat pengguna.");
    await fetchUsers();
    return data;
  }

  async function updateUser(id: string, payload: { username?: string; password?: string; name?: string; role?: string }) {
    const authStore = useAuthStore();
    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal memperbarui pengguna.");
    await fetchUsers();

    // Jika yang di-update adalah akun yang sedang login sendiri, perbarui data di authStore
    if (authStore.user?.id === id) {
      if (payload.username) authStore.user.username = payload.username;
      if (payload.name) authStore.user.name = payload.name;
    }

    return data;
  }

  async function deleteUser(id: string) {
    const authStore = useAuthStore();
    const res = await fetch(`/api/users/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authStore.token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal menghapus pengguna.");
    await fetchUsers();
    return data;
  }

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
});
