import { Request, Response } from "express";
import { prisma } from "../config/db.js";
import { matchState } from "../services/matchState.js";
import { bracketService } from "../services/bracketService.js";
import { AuthenticatedRequest } from "../middlewares/auth.js";

export async function getActiveMatch(req: Request, res: Response) {
  const { key } = req.query;
  const settings = matchState.getSettings();

  if (key && typeof key === "string") {
    const match = matchState.getMatchByKey(key);
    return res.json({ match, settings });
  }

  // If no key, return list of all active matches
  const matches = matchState.getAllMatches();
  return res.json({ matches, settings });
}

export async function getMyAssignedMatch(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  const settings = matchState.getSettings();
  if (req.user.role === "SUPERADMIN") {
    // Superadmin has access to all matches
    return res.json({
      role: "SUPERADMIN",
      matches: matchState.getAllMatches(),
      settings,
    });
  }

  // Referee: find assigned match
  const match = matchState.getMatchByRefereeId(req.user.id);
  return res.json({
    role: "REFEREE",
    match,
    settings,
  });
}

export async function listMatches(_req: Request, res: Response) {
  try {
    const matches = await prisma.match.findMany({
      orderBy: { courtName: "asc" },
      include: { teamA: true, teamB: true, assignedReferee: true },
    });
    return res.json({ matches });
  } catch (error) {
    console.error("Error listing matches:", error);
    return res.status(500).json({ error: "Gagal memuat daftar pertandingan." });
  }
}

export async function createMatch(req: Request, res: Response) {
  try {
    const match = await matchState.registerNewMatch(req.body);
    return res.status(201).json({ match });
  } catch (error) {
    console.error("Error creating match:", error);
    return res.status(500).json({ error: "Gagal membuat pertandingan baru." });
  }
}

export async function changeScore(req: Request, res: Response) {
  try {
    const { matchKey, team, delta } = req.body;
    if (!matchKey) return res.status(400).json({ error: "matchKey wajib diisi." });
    if (team !== "A" && team !== "B") return res.status(400).json({ error: "Team harus 'A' atau 'B'." });

    const numDelta = parseInt(delta, 10);
    matchState.updateScore(matchKey, team, numDelta);
    return res.json({ match: matchState.getMatchByKey(matchKey) });
  } catch (error) {
    return res.status(500).json({ error: "Gagal mengubah skor." });
  }
}

export async function resetScore(req: Request, res: Response) {
  try {
    const { matchKey } = req.body;
    if (!matchKey) return res.status(400).json({ error: "matchKey wajib diisi." });

    matchState.resetScore(matchKey);
    return res.json({ match: matchState.getMatchByKey(matchKey) });
  } catch (error) {
    return res.status(500).json({ error: "Gagal me-reset skor." });
  }
}

export async function swapSide(req: Request, res: Response) {
  try {
    const { matchKey } = req.body;
    if (!matchKey) return res.status(400).json({ error: "matchKey wajib diisi." });

    matchState.swapSide(matchKey);
    return res.json({ match: matchState.getMatchByKey(matchKey) });
  } catch (error) {
    return res.status(500).json({ error: "Gagal menukar posisi tim." });
  }
}

export async function updateConfig(req: Request, res: Response) {
  try {
    const { matchKey, config } = req.body;
    if (!matchKey) return res.status(400).json({ error: "matchKey wajib diisi." });

    matchState.updateMatchConfig(matchKey, config);
    return res.json({ match: matchState.getMatchByKey(matchKey) });
  } catch (error) {
    return res.status(500).json({ error: "Gagal memperbarui pengaturan." });
  }
}

export async function assignReferee(req: Request, res: Response) {
  try {
    const { matchKey, refereeId } = req.body;
    if (!matchKey) return res.status(400).json({ error: "matchKey wajib diisi." });

    matchState.updateMatchConfig(matchKey, { assignedRefereeId: refereeId || null });
    return res.json({ match: matchState.getMatchByKey(matchKey) });
  } catch (error) {
    return res.status(500).json({ error: "Gagal assign wasit." });
  }
}

export async function setWaitingState(req: Request, res: Response) {
  try {
    const { matchKey, isWaiting } = req.body;
    if (!matchKey) return res.status(400).json({ error: "matchKey wajib diisi." });

    matchState.setCourtWaitingState(matchKey, isWaiting ?? true);

    if (isWaiting) {
      // Sinkronkan juga bracket match yang mungkin masih terhubung ke meja ini agar kembali ke status READY
      await prisma.bracketMatch.updateMany({
        where: { courtMatchKey: matchKey, status: "LIVE" },
        data: {
          status: "READY",
          assignedCourt: null,
          courtMatchKey: null,
        },
      });
      bracketService.broadcastBracket();
    }

    return res.json({ success: true, match: matchState.getMatchByKey(matchKey) });
  } catch (error) {
    return res.status(500).json({ error: "Gagal mengubah status menunggu meja." });
  }
}

export async function resetUnassignedCourts(_req: Request, res: Response) {
  try {
    matchState.resetUnassignedCourtsToWaiting();
    const allMatches = matchState.getAllMatches();
    for (const court of allMatches) {
      if (court.isWaitingForNext) {
        await prisma.bracketMatch.updateMany({
          where: { courtMatchKey: court.matchKey, status: "LIVE" },
          data: {
            status: "READY",
            assignedCourt: null,
            courtMatchKey: null,
          },
        });
      }
    }
    bracketService.broadcastBracket();
    return res.json({ success: true, matches: matchState.getAllMatches() });
  } catch (error) {
    return res.status(500).json({ error: "Gagal me-reset meja yang kosong." });
  }
}
