import { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { matchState } from "../services/matchState.js";

export async function getSponsorSettings(_req: Request, res: Response) {
  try {
    const sponsors = await prisma.sponsor.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
    const settings = matchState.getSettings();
    return res.json({ sponsors, settings });
  } catch (error) {
    return res.status(500).json({ error: "Gagal memuat data sponsor." });
  }
}

export async function updateSettings(req: Request, res: Response) {
  try {
    const { tickerText, showTicker, showSponsor } = req.body;
    await matchState.updateSettings({
      ...(tickerText !== undefined && { tickerText }),
      ...(showTicker !== undefined && { showTicker: !!showTicker }),
      ...(showSponsor !== undefined && { showSponsor: !!showSponsor }),
    });
    return res.json({ settings: matchState.getSettings() });
  } catch (error) {
    return res.status(500).json({ error: "Gagal memperbarui pengaturan sponsor/ticker." });
  }
}

export async function createSponsor(req: Request, res: Response) {
  try {
    const { name, logoUrl: inputLogoUrl, order } = req.body;
    let finalLogoUrl = inputLogoUrl || null;
    if (req.file) {
      finalLogoUrl = `/uploads/${req.file.filename}`;
    }

    const sponsor = await prisma.sponsor.create({
      data: {
        name,
        logoUrl: finalLogoUrl,
        order: order ? parseInt(order, 10) : 0,
        isActive: true,
      },
    });

    return res.status(201).json({ sponsor });
  } catch (error) {
    return res.status(500).json({ error: "Gagal menambahkan sponsor." });
  }
}

export async function deleteSponsor(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.sponsor.delete({ where: { id } });
    return res.json({ message: "Sponsor berhasil dihapus." });
  } catch (error) {
    return res.status(500).json({ error: "Gagal menghapus sponsor." });
  }
}

