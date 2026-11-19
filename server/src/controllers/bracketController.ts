import { Request, Response } from "express";
import { bracketService } from "../services/bracketService.js";

export async function createBracket(req: Request, res: Response) {
  try {
    const { name, type, teamIds, format } = req.body;
    if (!teamIds || !Array.isArray(teamIds) || teamIds.length < 2) {
      return res.status(400).json({ error: "Pilih minimal 2 tim untuk membuat bagan turnamen." });
    }

    const tournament = await bracketService.createBracket({
      name,
      type: type || "SINGLE_ELIMINATION",
      teamIds,
      format: format || "BO3",
    });

    return res.status(201).json({ tournament });
  } catch (error: any) {
    console.error("Error creating bracket:", error);
    return res.status(500).json({ error: error.message || "Gagal membuat braket turnamen." });
  }
}

export async function getActiveBracket(req: Request, res: Response) {
  try {
    const tournamentId = req.query.id as string | undefined;
    const tournament = await bracketService.getTournamentBracket(tournamentId);
    return res.json({ tournament });
  } catch (error) {
    console.error("Error fetching bracket:", error);
    return res.status(500).json({ error: "Gagal memuat data braket." });
  }
}

export async function listTournaments(_req: Request, res: Response) {
  try {
    const tournaments = await bracketService.listTournaments();
    return res.json({ tournaments });
  } catch (error) {
    return res.status(500).json({ error: "Gagal memuat daftar turnamen." });
  }
}

export async function shuffleBracket(req: Request, res: Response) {
  try {
    const { tournamentId } = req.body;
    if (!tournamentId) return res.status(400).json({ error: "tournamentId diperlukan." });

    const tournament = await bracketService.shuffleBracket(tournamentId);
    return res.json({ tournament, message: "Posisi tim dalam bagan berhasil diacak!" });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Gagal mengacak braket." });
  }
}

export async function finalizeBracket(req: Request, res: Response) {
  try {
    const { tournamentId } = req.body;
    if (!tournamentId) return res.status(400).json({ error: "tournamentId diperlukan." });

    const tournament = await bracketService.finalizeBracket(tournamentId);
    return res.json({ tournament, message: "Braket berhasil dikunci (Finalized)!" });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Gagal memfinalisasi braket." });
  }
}

export async function assignToCourt(req: Request, res: Response) {
  try {
    const { bracketMatchId, courtMatchKey, format } = req.body;
    if (!bracketMatchId || !courtMatchKey) {
      return res.status(400).json({ error: "bracketMatchId dan courtMatchKey diperlukan." });
    }

    const result = await bracketService.assignMatchToCourt(bracketMatchId, courtMatchKey, format);
    return res.json({
      message: `Pertandingan berhasil dikirim ke ${result.court?.courtName}!`,
      result,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Gagal menugaskan pertandingan ke meja." });
  }
}

export async function unassignFromCourt(req: Request, res: Response) {
  try {
    const { bracketMatchId } = req.body;
    if (!bracketMatchId) {
      return res.status(400).json({ error: "bracketMatchId diperlukan." });
    }

    const result = await bracketService.unassignMatchFromCourt(bracketMatchId);
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Gagal membatalkan penugasan ke meja." });
  }
}

export async function finishMatch(req: Request, res: Response) {
  try {
    const { courtMatchKey, bracketMatchId } = req.body;
    if (!courtMatchKey && !bracketMatchId) {
      return res.status(400).json({ error: "courtMatchKey atau bracketMatchId diperlukan." });
    }

    const result = await bracketService.finishMatch(courtMatchKey, bracketMatchId);
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Gagal menyelesaikan pertandingan." });
  }
}

