import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";
import { matchState } from "../services/matchState.js";
import { AuthenticatedRequest } from "../middlewares/auth.js";
import { Role } from "@prisma/client";

// GET /api/users - List all users (Superadmin only)
export async function listUsers(_req: AuthenticatedRequest, res: Response) {
  try {
    // Sinkronkan wasit dan meja sebelum mengembalikan daftar akun
    await matchState.syncCourtsWithReferees();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        assignedMatches: {
          select: {
            id: true,
            courtName: true,
            matchKey: true,
          },
        },
        _count: {
          select: { assignedMatches: true },
        },
      },
      orderBy: [
        { role: "asc" }, // SUPERADMIN first
        { username: "asc" },
      ],
    });

    return res.json({ users });
  } catch (error: any) {
    console.error("Error listing users:", error);
    return res.status(500).json({ error: "Gagal memuat daftar pengguna." });
  }
}

// POST /api/users - Create new user (Superadmin only)
export async function createUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ error: "Username, password, dan nama lengkap wajib diisi." });
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: "Username minimal 3 karakter." });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: "Password minimal 4 karakter." });
    }

    // Cek duplikasi username
    const existing = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (existing) {
      return res.status(400).json({ error: `Username "${cleanUsername}" sudah digunakan oleh akun lain.` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === "SUPERADMIN" ? Role.SUPERADMIN : Role.REFEREE;

    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        password: hashedPassword,
        name: name.trim(),
        role: userRole,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // Jika akun baru adalah petugas wasit, otomatis buatkan meja pertandingannya
    if (user.role === Role.REFEREE) {
      await matchState.syncCourtsWithReferees();
      await matchState.initializeFromDB();
      matchState.broadcastOverview();
    }

    return res.status(201).json({
      message: `Akun "${user.username}" berhasil dibuat! Meja pertandingan telah otomatis disiapkan.`,
      user,
    });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return res.status(500).json({ error: "Gagal membuat akun pengguna." });
  }
}

// PUT /api/users/:id - Update username, name, role, or password (Superadmin only)
export async function updateUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { username, password, name, role } = req.body;

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return res.status(404).json({ error: "Akun pengguna tidak ditemukan." });
    }

    const updateData: any = {};

    // 1. Update Username jika ada
    if (username !== undefined) {
      const cleanUsername = username.trim().toLowerCase();
      if (cleanUsername.length < 3) {
        return res.status(400).json({ error: "Username minimal 3 karakter." });
      }

      if (cleanUsername !== targetUser.username) {
        const existing = await prisma.user.findUnique({
          where: { username: cleanUsername },
        });
        if (existing && existing.id !== id) {
          return res.status(400).json({ error: `Username "${cleanUsername}" sudah digunakan.` });
        }
        updateData.username = cleanUsername;
      }
    }

    // 2. Update Nama jika ada
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ error: "Nama lengkap tidak boleh kosong." });
      }
      updateData.name = name.trim();
    }

    // 3. Update Role jika ada
    if (role !== undefined) {
      if (role === "REFEREE" && targetUser.role === Role.SUPERADMIN && req.user?.id === id) {
        return res.status(400).json({ error: "Anda tidak dapat menurunkan role akun Anda sendiri." });
      }
      updateData.role = role === "SUPERADMIN" ? Role.SUPERADMIN : Role.REFEREE;
    }

    // 4. Update Password baru jika diisi
    if (password && password.trim() !== "") {
      if (password.length < 4) {
        return res.status(400).json({ error: "Password baru minimal 4 karakter." });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    });

    // Perbarui state di memori jika ada perubahan nama/username
    if (updateData.name || updateData.username) {
      await matchState.initializeFromDB();
      matchState.broadcastOverview();
    }

    return res.json({
      message: `Akun "${updatedUser.username}" berhasil diperbarui!`,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "Gagal memperbarui akun pengguna." });
  }
}

// DELETE /api/users/:id - Delete user (Superadmin only)
export async function deleteUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    if (req.user?.id === id) {
      return res.status(400).json({ error: "Anda tidak dapat menghapus akun Anda sendiri yang sedang digunakan." });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return res.status(404).json({ error: "Akun pengguna tidak ditemukan." });
    }

    // Cek apakah ada superadmin lain tersisa jika akun yang dihapus adalah SUPERADMIN
    if (targetUser.role === Role.SUPERADMIN) {
      const superadminCount = await prisma.user.count({
        where: { role: Role.SUPERADMIN },
      });
      if (superadminCount <= 1) {
        return res.status(400).json({ error: "Tidak dapat menghapus superadmin terakhir." });
      }
    }

    // Jika akun wasit yang dihapus memiliki meja pertandingan, otomatis hapus mejanya
    const assignedMatch = await prisma.match.findFirst({
      where: { assignedRefereeId: id },
    });

    if (assignedMatch) {
      // Jika meja terhubung ke pertandingan di bagan, kembalikan ke READY
      if (assignedMatch.bracketMatchId) {
        await prisma.bracketMatch.updateMany({
          where: { id: assignedMatch.bracketMatchId },
          data: { status: "READY", assignedCourt: null, courtMatchKey: null },
        });
      }
      await prisma.match.delete({
        where: { id: assignedMatch.id },
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    // Re-sync memori matchState dan broadcast
    await matchState.initializeFromDB();
    matchState.broadcastOverview();

    return res.json({
      message: `Akun "${targetUser.username}" (${targetUser.name}) dan meja pertandingannya berhasil dihapus.`,
    });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: "Gagal menghapus akun pengguna." });
  }
}
