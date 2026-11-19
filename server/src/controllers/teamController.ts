import { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { matchState } from "../services/matchState.js";
import { bracketService } from "../services/bracketService.js";

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
    const { name, shortName, colorHex, institution, logoUrl: inputLogoUrl } = req.body;
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
        institution: institution ? String(institution).trim() : null,
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

// Helper function untuk generate singkatan / tag tim otomatis dari nama
export function generateShortName(name: string): string {
  const cleaned = name.trim().toUpperCase();
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length >= 3) {
    // Ambil huruf pertama dari 3 kata pertama (misal: "SQUAD NAGA HITAM" -> "SNH")
    return words.slice(0, 4).map((w) => w[0]).join("");
  } else if (words.length === 2) {
    // Ambil 2 huruf dari kata pertama + 2 huruf dari kata kedua (misal: "ALTER EGO" -> "AE" atau "ALTE")
    if (words[0].length >= 2 && words[1].length >= 2) {
      return (words[0][0] + words[1].slice(0, 2)).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  } else {
    // 1 kata: ambil 3-4 huruf pertama (misal: "PANTERA" -> "PNT" / "PANT")
    return cleaned.slice(0, 4);
  }
}

// Bulk Upload Teams (Dari Google Form / Excel / CSV)
export async function bulkCreateTeams(req: Request, res: Response) {
  try {
    const { teams: inputTeams } = req.body;

    if (!Array.isArray(inputTeams) || inputTeams.length === 0) {
      return res.status(400).json({ error: "Data tim tidak valid atau kosong." });
    }

    // Ambil semua nama tim yang sudah ada di database untuk deteksi duplikasi
    const existingTeams = await prisma.team.findMany({
      select: { name: true },
    });
    const existingNameSet = new Set(existingTeams.map((t) => t.name.trim().toUpperCase()));

    const newTeamsData: Array<{
      name: string;
      shortName: string;
      colorHex: string;
      institution: string | null;
      logoUrl: string | null;
    }> = [];

    const processedNames = new Set<string>();
    let skippedCount = 0;

    for (const item of inputTeams) {
      if (!item || !item.name) {
        skippedCount++;
        continue;
      }

      const nameTrimmed = String(item.name).trim();
      const nameUpper = nameTrimmed.toUpperCase();

      // Lewati jika kosong, atau sudah ada di database, atau duplikat di dalam batch input
      if (!nameTrimmed || existingNameSet.has(nameUpper) || processedNames.has(nameUpper)) {
        skippedCount++;
        continue;
      }

      processedNames.add(nameUpper);

      // Tentukan shortName: gunakan input jika ada, atau buat otomatis dari nama
      const shortName = item.shortName && String(item.shortName).trim()
        ? String(item.shortName).trim().toUpperCase().slice(0, 5)
        : generateShortName(nameTrimmed);

      newTeamsData.push({
        name: nameTrimmed,
        shortName: shortName || nameTrimmed.slice(0, 4).toUpperCase(),
        colorHex: item.colorHex || "#2563eb",
        institution: item.institution ? String(item.institution).trim() : null,
        logoUrl: item.logoUrl || null,
      });
    }

    if (newTeamsData.length > 0) {
      await prisma.team.createMany({
        data: newTeamsData,
      });
    }

    // Ambil seluruh tim terupdate
    const allTeams = await prisma.team.findMany({
      orderBy: { name: "asc" },
    });

    return res.status(201).json({
      success: true,
      message: `Berhasil menambahkan ${newTeamsData.length} tim baru. (${skippedCount} tim dilewati karena sudah ada/duplikat).`,
      addedCount: newTeamsData.length,
      skippedCount,
      teams: allTeams,
    });
  } catch (error: any) {
    console.error("Error bulk creating teams:", error);
    return res.status(500).json({ error: "Gagal memproses bulk upload tim." });
  }
}

export async function updateTeam(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, shortName, colorHex, institution, logoUrl: inputLogoUrl } = req.body;

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
        ...(institution !== undefined && { institution: institution ? String(institution).trim() : null }),
        ...(finalLogoUrl !== undefined && { logoUrl: finalLogoUrl }),
      },
    });

    // Sinkronkan ke semua meja aktif di memory & broadcast ke OBS secara instan
    for (const match of matchState.getAllMatches()) {
      let changed = false;
      const targetName = updated.name.toUpperCase();
      if (match.teamA.id === id || match.teamA.name.toUpperCase() === targetName) {
        match.teamA.name = updated.name;
        match.teamA.shortName = updated.shortName;
        match.teamA.institution = updated.institution;
        match.teamA.logoUrl = updated.logoUrl;
        match.teamA.id = updated.id;
        changed = true;
      }
      if (match.teamB.id === id || match.teamB.name.toUpperCase() === targetName) {
        match.teamB.name = updated.name;
        match.teamB.shortName = updated.shortName;
        match.teamB.institution = updated.institution;
        match.teamB.logoUrl = updated.logoUrl;
        match.teamB.id = updated.id;
        changed = true;
      }
      if (changed) {
        matchState.broadcast(match.matchKey);
        matchState.schedulePersistence(match.matchKey);
      }
    }

    // Sinkronkan juga ke seluruh node BracketMatch di database
    try {
      await prisma.bracketMatch.updateMany({
        where: { OR: [{ teamAId: id }, { teamAName: updated.name }] },
        data: {
          teamAId: updated.id,
          teamAName: updated.name,
          teamAShort: updated.shortName,
          teamAInstitution: updated.institution,
          teamALogo: updated.logoUrl,
        },
      });

      await prisma.bracketMatch.updateMany({
        where: { OR: [{ teamBId: id }, { teamBName: updated.name }] },
        data: {
          teamBId: updated.id,
          teamBName: updated.name,
          teamBShort: updated.shortName,
          teamBInstitution: updated.institution,
          teamBLogo: updated.logoUrl,
        },
      });

      bracketService.broadcastBracket();
    } catch (e) {
      console.error("[TeamController] Non-fatal error updating bracket nodes:", e);
    }

    return res.json({ team: updated });
  } catch (error: any) {
    console.error("Error updating team:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Nama tim sudah digunakan oleh tim lain di database." });
    }
    return res.status(500).json({ error: error.message || "Gagal memperbarui data tim." });
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

