import { Request, Response } from "express";
import { prisma } from "../config/db.js";

export async function listTeams(_req: Request, res: Response) {
  try {
    const teams = await prisma.team.findMany({
      orderBy: { name: "asc" },
    });
    return res.json({ teams });
  } catch (error) {
    console.error("Error listing teams:", error);
    return res.status(500).json({ error: "Gagal memuat daftar tim." });
  }
}

export async function createTeam(req: Request, res: Response) {
  try {
    const { name, shortName, colorHex, logoUrl: inputLogoUrl } = req.body;
    if (!name || !shortName) {
      return res.status(400).json({ error: "Nama tim dan singkatan (tag) wajib diisi." });
    }

    let finalLogoUrl = inputLogoUrl || null;
    if (req.file) {
      finalLogoUrl = `/uploads/${req.file.filename}`;
    }

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        shortName: shortName.trim().toUpperCase(),
        colorHex: colorHex || "#2563eb",
        logoUrl: finalLogoUrl,
      },
    });

    return res.status(201).json({ team });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Nama tim sudah terdaftar di database." });
    }
    console.error("Error creating team:", error);
    return res.status(500).json({ error: "Gagal menambahkan tim." });
  }
}

export async function updateTeam(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, shortName, colorHex, logoUrl: inputLogoUrl } = req.body;

    let finalLogoUrl = inputLogoUrl;
    if (req.file) {
      finalLogoUrl = `/uploads/${req.file.filename}`;
    }

    const updated = await prisma.team.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(shortName && { shortName: shortName.trim().toUpperCase() }),
        ...(colorHex && { colorHex }),
        ...(finalLogoUrl !== undefined && { logoUrl: finalLogoUrl }),
      },
    });

    return res.json({ team: updated });
  } catch (error) {
    console.error("Error updating team:", error);
    return res.status(500).json({ error: "Gagal memperbarui data tim." });
  }
}

export async function deleteTeam(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.team.delete({
      where: { id },
    });
    return res.json({ message: "Tim berhasil dihapus." });
  } catch (error) {
    console.error("Error deleting team:", error);
    return res.status(500).json({ error: "Gagal menghapus tim." });
  }
}

