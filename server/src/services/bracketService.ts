import { prisma } from "../config/db.js";
import { matchState } from "./matchState.js";
import { Server as SocketIOServer } from "socket.io";

export interface BracketNodeData {
  id: string;
  round: number;
  roundName: string;
  section: "UPPER" | "LOWER" | "GRAND_FINAL";
  matchOrder: number;
  teamA?: {
    id?: string | null;
    name?: string | null;
    shortName?: string | null;
    logoUrl?: string | null;
    score: number;
  };
  teamB?: {
    id?: string | null;
    name?: string | null;
    shortName?: string | null;
    logoUrl?: string | null;
    score: number;
  };
  isBye: boolean;
  winnerTeam?: string | null;
  status: "PENDING" | "READY" | "LIVE" | "COMPLETED";
  assignedCourt?: string | null;
  courtMatchKey?: string | null;
  nextMatchId?: string | null;
  nextMatchSlot?: string | null;
}

class BracketService {
  private io: SocketIOServer | null = null;

  public setSocketServer(io: SocketIOServer) {
    this.io = io;
  }

  public broadcastBracket(tournamentId?: string) {
    if (!this.io) return;
    this.io.emit("bracket:update", {
      tournamentId,
      timestamp: new Date().toISOString(),
    });
  }

  // Get next power of 2 (e.g. 4, 8, 16, 32)
  private getBracketSize(count: number): number {
    if (count <= 2) return 2;
    if (count <= 4) return 4;
    if (count <= 8) return 8;
    if (count <= 16) return 16;
    return 32;
  }

  private getRoundName(round: number, totalRounds: number, section: string): string {
    if (section === "GRAND_FINAL") return "Grand Finals";
    const remaining = totalRounds - round;
    if (remaining === 0) return section === "LOWER" ? "Lower Finals" : "Grand Finals";
    if (remaining === 1) return section === "LOWER" ? "Lower Semifinals" : "Semifinals";
    if (remaining === 2) return section === "LOWER" ? "Lower Quarterfinals" : "Quarterfinals";
    return `${section === "LOWER" ? "Lower " : ""}Round ${round}`;
  }

  // 1. Create a dynamic bracket
  public async createBracket(data: {
    name: string;
    type: "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION";
    teamIds: string[];
    format?: "BO1" | "BO3" | "BO5" | "BO7";
  }) {
    const teamRecords = await prisma.team.findMany({
      where: { id: { in: data.teamIds } },
    });
    const teamMap = new Map(teamRecords.map((t) => [t.id, t]));
    const teams = data.teamIds.map((id) => teamMap.get(id)).filter(Boolean);

    if (teams.length < 2) {
      throw new Error("Paling sedikit 2 tim harus didaftarkan untuk membuat braket turnamen.");
    }

    const tournament = await prisma.tournament.create({
      data: {
        name: data.name || "MPL COMMUNITY CUP",
        type: data.type || "SINGLE_ELIMINATION",
        status: "DRAFT",
        format: data.format || "BO3",
      },
    });

    if (data.type === "DOUBLE_ELIMINATION") {
      await this.generateDoubleElimination(tournament.id, teams);
    } else {
      await this.generateSingleElimination(tournament.id, teams);
    }

    // Ketika turnamen baru dibuat, kosongkan dan set semua meja ke mode menunggu
    for (const court of matchState.getAllMatches()) {
      matchState.setCourtWaitingState(court.matchKey, true);
    }

    this.broadcastBracket(tournament.id);
    return this.getTournamentBracket(tournament.id);
  }

  // Generate Single Elimination with automatic BYE
  private async generateSingleElimination(tournamentId: string, teams: any[]) {
    const bracketSize = this.getBracketSize(teams.length);
    const totalRounds = Math.log2(bracketSize);

    // Create matches round by round from Finals down to Round 1
    const roundsMatches: any[][] = [];

    // Grand Finals (Round = totalRounds)
    const finals = await prisma.bracketMatch.create({
      data: {
        tournamentId,
        round: totalRounds,
        roundName: "Grand Finals",
        section: "UPPER",
        matchOrder: 1,
        status: "PENDING",
      },
    });
    roundsMatches[totalRounds] = [finals];

    // Build intermediate rounds backwards so nextMatchId is known
    for (let r = totalRounds - 1; r >= 1; r--) {
      const matchCount = Math.pow(2, totalRounds - r);
      roundsMatches[r] = [];

      for (let m = 0; m < matchCount; m++) {
        const nextRoundIndex = Math.floor(m / 2);
        const nextMatch = roundsMatches[r + 1][nextRoundIndex];
        const nextSlot = m % 2 === 0 ? "A" : "B";

        const match = await prisma.bracketMatch.create({
          data: {
            tournamentId,
            round: r,
            roundName: this.getRoundName(r, totalRounds, "UPPER"),
            section: "UPPER",
            matchOrder: m + 1,
            status: "PENDING",
            nextMatchId: nextMatch.id,
            nextMatchSlot: nextSlot,
          },
        });
        roundsMatches[r].push(match);
      }
    }

    // Populate Round 1 with teams and BYEs
    await this.seedRound1(tournamentId, roundsMatches[1], teams, bracketSize);
  }

  // Populate Round 1 with seeding
  private async seedRound1(tournamentId: string, round1Matches: any[], teams: any[], bracketSize: number) {
    // Fill array up to bracketSize with null (BYEs)
    const slots: (any | null)[] = [...teams];
    while (slots.length < bracketSize) {
      slots.push(null); // BYE slot
    }

    // Standard tournament distribution for power of 2
    for (let i = 0; i < round1Matches.length; i++) {
      const match = round1Matches[i];
      const teamA = slots[i * 2] || null;
      const teamB = slots[i * 2 + 1] || null;

      const isBye = !teamA || !teamB;
      let status: any = "PENDING";
      let winnerTeam: string | null = null;
      let winnerTeamId: string | null = null;

      if (teamA && teamB) {
        status = "READY";
      } else if (teamA && !teamB) {
        // Team A automatic bye advance
        status = "COMPLETED";
        winnerTeam = "A";
        winnerTeamId = teamA.id;
      } else if (!teamA && teamB) {
        // Team B automatic bye advance
        status = "COMPLETED";
        winnerTeam = "B";
        winnerTeamId = teamB.id;
      }

      await prisma.bracketMatch.update({
        where: { id: match.id },
        data: {
          teamAId: teamA?.id || null,
          teamAName: teamA?.name || (teamA ? "TEAM A" : "BYE"),
          teamAShort: teamA?.shortName || (teamA ? "A" : "BYE"),
          teamALogo: teamA?.logoUrl || null,
          scoreA: 0,
          teamBId: teamB?.id || null,
          teamBName: teamB?.name || (teamB ? "TEAM B" : "BYE"),
          teamBShort: teamB?.shortName || (teamB ? "B" : "BYE"),
          teamBLogo: teamB?.logoUrl || null,
          scoreB: 0,
          assignedCourt: null,
          courtMatchKey: null,
          isBye,
          status,
          winnerTeam,
          winnerTeamId,
        },
      });

      // If there is an automatic BYE winner, advance to next match immediately
      if (winnerTeamId && match.nextMatchId) {
        const winningTeam = winnerTeam === "A" ? teamA : teamB;
        await this.advanceTeamToNextNode(match.nextMatchId, match.nextMatchSlot, winningTeam);
      }
    }
  }

  // Generate Double Elimination
  private async generateDoubleElimination(tournamentId: string, teams: any[]) {
    const bracketSize = this.getBracketSize(teams.length);
    const upperRounds = Math.log2(bracketSize);

    // 1. Grand Finals
    const grandFinal = await prisma.bracketMatch.create({
      data: {
        tournamentId,
        round: upperRounds + 1,
        roundName: "Grand Finals",
        section: "GRAND_FINAL",
        matchOrder: 1,
        status: "PENDING",
      },
    });

    // 2. Upper Bracket
    const upperMatches: any[][] = [];
    upperMatches[upperRounds] = [
      await prisma.bracketMatch.create({
        data: {
          tournamentId,
          round: upperRounds,
          roundName: "Upper Finals",
          section: "UPPER",
          matchOrder: 1,
          status: "PENDING",
          nextMatchId: grandFinal.id,
          nextMatchSlot: "A",
        },
      }),
    ];

    for (let r = upperRounds - 1; r >= 1; r--) {
      const matchCount = Math.pow(2, upperRounds - r);
      upperMatches[r] = [];

      for (let m = 0; m < matchCount; m++) {
        const nextRoundIndex = Math.floor(m / 2);
        const nextMatch = upperMatches[r + 1][nextRoundIndex];
        const nextSlot = m % 2 === 0 ? "A" : "B";

        const match = await prisma.bracketMatch.create({
          data: {
            tournamentId,
            round: r,
            roundName: this.getRoundName(r, upperRounds, "UPPER"),
            section: "UPPER",
            matchOrder: m + 1,
            status: "PENDING",
            nextMatchId: nextMatch.id,
            nextMatchSlot: nextSlot,
          },
        });
        upperMatches[r].push(match);
      }
    }

    // 3. Lower Bracket (Losers Bracket)
    const lowerFinal = await prisma.bracketMatch.create({
      data: {
        tournamentId,
        round: upperRounds,
        roundName: "Lower Finals",
        section: "LOWER",
        matchOrder: 1,
        status: "PENDING",
        nextMatchId: grandFinal.id,
        nextMatchSlot: "B",
      },
    });

    // Seed Upper Round 1
    await this.seedRound1(tournamentId, upperMatches[1], teams, bracketSize);

    // Link Upper Finals loser to Lower Finals slot B
    await prisma.bracketMatch.update({
      where: { id: upperMatches[upperRounds][0].id },
      data: {
        loserMatchId: lowerFinal.id,
        loserMatchSlot: "B",
      },
    });
  }

  // Helper to advance a team to the next node
  private async advanceTeamToNextNode(nextMatchId: string, slot: string | null | undefined, team: any) {
    if (!nextMatchId || !team) return;

    const nextMatch = await prisma.bracketMatch.findUnique({
      where: { id: nextMatchId },
    });
    if (!nextMatch) return;

    const updateData: any = {};
    if (slot === "A") {
      updateData.teamAId = team.id;
      updateData.teamAName = team.name;
      updateData.teamAShort = team.shortName;
      updateData.teamALogo = team.logoUrl;
    } else {
      updateData.teamBId = team.id;
      updateData.teamBName = team.name;
      updateData.teamBShort = team.shortName;
      updateData.teamBLogo = team.logoUrl;
    }

    // Check if both teams are present to mark READY
    const finalTeamA = slot === "A" ? team.id : nextMatch.teamAId;
    const finalTeamB = slot === "B" ? team.id : nextMatch.teamBId;

    if (finalTeamA && finalTeamB) {
      updateData.status = "READY";
    }

    await prisma.bracketMatch.update({
      where: { id: nextMatchId },
      data: updateData,
    });
  }

  // 2. Shuffle / Randomize Teams in Bracket (Only in DRAFT status)
  public async shuffleBracket(tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { matches: true },
    });

    if (!tournament) throw new Error("Turnamen tidak ditemukan.");
    if (tournament.status !== "DRAFT") {
      throw new Error("Braket yang sudah di-finalisasi tidak dapat diacak lagi.");
    }

    // Get all initial Round 1 teams
    const round1Matches = await prisma.bracketMatch.findMany({
      where: { tournamentId, round: 1, section: "UPPER" },
      orderBy: { matchOrder: "asc" },
    });

    const teamIds: string[] = [];
    for (const m of round1Matches) {
      if (m.teamAId) teamIds.push(m.teamAId);
      if (m.teamBId) teamIds.push(m.teamBId);
    }

    // Random shuffle teamIds (Fisher-Yates)
    const shuffled = [...teamIds];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Ambil data tim dan pertahankan URUTAN hasil acak Fisher-Yates
    const teamRecords = await prisma.team.findMany({
      where: { id: { in: shuffled } },
    });
    const teamMap = new Map(teamRecords.map((t) => [t.id, t]));
    const teams = shuffled.map((id) => teamMap.get(id)).filter(Boolean);

    // Reset ronde lanjutan (Round > 1 atau non-UPPER) dari seeded BYE sebelumnya
    await prisma.bracketMatch.updateMany({
      where: {
        tournamentId,
        OR: [
          { round: { gt: 1 } },
          { section: { not: "UPPER" } },
        ],
      },
      data: {
        teamAId: null,
        teamAName: null,
        teamAShort: null,
        teamALogo: null,
        scoreA: 0,
        teamBId: null,
        teamBName: null,
        teamBShort: null,
        teamBLogo: null,
        scoreB: 0,
        status: "PENDING",
        winnerTeam: null,
        winnerTeamId: null,
        assignedCourt: null,
        courtMatchKey: null,
      },
    });

    // Re-seed Round 1
    const bracketSize = this.getBracketSize(teams.length);
    await this.seedRound1(tournamentId, round1Matches, teams, bracketSize);

    await this.syncAllCourtsWithBracket(tournamentId);
    this.broadcastBracket(tournamentId);
    return this.getTournamentBracket(tournamentId);
  }

  // 3. Finalize Bracket (Lock it from changes)
  public async finalizeBracket(tournamentId: string) {
    const tournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "FINALIZED" },
    });

    this.broadcastBracket(tournamentId);
    return tournament;
  }

  // 4. Assign Bracket Match to Court (Kirim ke Meja)
  public async assignMatchToCourt(
    bracketMatchId: string,
    courtMatchKey: string,
    format?: "BO1" | "BO3" | "BO5" | "BO7"
  ) {
    const bracketMatch = await prisma.bracketMatch.findUnique({
      where: { id: bracketMatchId },
      include: { tournament: true },
    });

    if (!bracketMatch) throw new Error("Pertandingan braket tidak ditemukan.");
    if (!bracketMatch.teamAId || !bracketMatch.teamBId) {
      throw new Error("Kedua tim harus sudah ditentukan sebelum dikirim ke meja.");
    }

    const court = matchState.getMatchByKey(courtMatchKey);
    if (!court) throw new Error("Meja/Court pertandingan tidak ditemukan.");

    const matchFormat = (format || bracketMatch.tournament.format || "BO3") as "BO1" | "BO3" | "BO5" | "BO7";

    // Update Court live state
    matchState.updateMatchConfig(courtMatchKey, {
      tournamentName: bracketMatch.tournament.name,
      roundName: bracketMatch.roundName,
      format: matchFormat,
      teamA: {
        id: bracketMatch.teamAId,
        name: bracketMatch.teamAName || "TEAM A",
        shortName: bracketMatch.teamAShort || "A",
        logoUrl: bracketMatch.teamALogo,
      },
      teamB: {
        id: bracketMatch.teamBId,
        name: bracketMatch.teamBName || "TEAM B",
        shortName: bracketMatch.teamBShort || "B",
        logoUrl: bracketMatch.teamBLogo,
      },
    });

    // Reset score on the court to 0-0 and clear waiting status
    matchState.resetScore(courtMatchKey);
    const courtLive = matchState.getMatchByKey(courtMatchKey);
    if (courtLive) {
      courtLive.isWaitingForNext = false;
      courtLive.bracketMatchId = bracketMatch.id;
      matchState.broadcast(courtMatchKey);
    }

    // Update BracketMatch status
    await prisma.bracketMatch.update({
      where: { id: bracketMatchId },
      data: {
        status: "LIVE",
        assignedCourt: court.courtName,
        courtMatchKey,
      },
    });

    // Set Tournament status to IN_PROGRESS if FINALIZED
    await prisma.tournament.update({
      where: { id: bracketMatch.tournamentId },
      data: { status: "IN_PROGRESS" },
    });

    await this.syncAllCourtsWithBracket(bracketMatch.tournamentId);
    this.broadcastBracket(bracketMatch.tournamentId);
    return { bracketMatch, court: matchState.getMatchByKey(courtMatchKey) };
  }

  // Sync live score from Court to Bracket node
  public async syncLiveScoreFromCourt(courtMatchKey: string) {
    const court = matchState.getMatchByKey(courtMatchKey);
    if (!court || !court.bracketMatchId) return;

    await prisma.bracketMatch.update({
      where: { id: court.bracketMatchId },
      data: {
        scoreA: court.teamA.score,
        scoreB: court.teamB.score,
      },
    });
    this.broadcastBracket();
  }

  // 5. Finish Match (Selesaikan Pertandingan & Majukan Pemenang di Bagan)
  public async finishMatch(courtMatchKey: string) {
    const court = matchState.getMatchByKey(courtMatchKey);
    if (!court) throw new Error("Meja pertandingan tidak ditemukan.");
    if (!court.bracketMatchId) {
      throw new Error("Pertandingan di meja ini tidak terhubung ke braket turnamen.");
    }

    const bracketMatch = await prisma.bracketMatch.findUnique({
      where: { id: court.bracketMatchId },
      include: { teamA: true, teamB: true },
    });
    if (!bracketMatch) throw new Error("Node braket tidak ditemukan.");

    // Determine winner based on court score
    const scoreA = court.teamA.score;
    const scoreB = court.teamB.score;

    if (scoreA === scoreB) {
      throw new Error("Skor masih seri! Pertandingan harus memiliki pemenang sebelum diselesaikan.");
    }

    const winnerTeam = scoreA > scoreB ? "A" : "B";
    const winnerTeamObj = winnerTeam === "A" ? bracketMatch.teamA : bracketMatch.teamB;
    const loserTeamObj = winnerTeam === "A" ? bracketMatch.teamB : bracketMatch.teamA;

    // 1. Mark bracket match as COMPLETED
    await prisma.bracketMatch.update({
      where: { id: bracketMatch.id },
      data: {
        scoreA,
        scoreB,
        winnerTeam,
        winnerTeamId: winnerTeamObj?.id || null,
        status: "COMPLETED",
        assignedCourt: null,
        courtMatchKey: null,
      },
    });

    // 2. Advance Winner to nextMatchId
    if (bracketMatch.nextMatchId && winnerTeamObj) {
      await this.advanceTeamToNextNode(bracketMatch.nextMatchId, bracketMatch.nextMatchSlot, winnerTeamObj);
    }

    // 3. If Double Elimination and there's a loserMatchId, drop loser
    if (bracketMatch.loserMatchId && loserTeamObj) {
      await this.advanceTeamToNextNode(bracketMatch.loserMatchId, bracketMatch.loserMatchSlot, loserTeamObj);
    }

    // 4. OTOMATIS KOSONGKAN MEJA & GANTI OVERLAY KE STATUS MENUNGGU MATCH BERIKUTNYA
    court.isWaitingForNext = true;
    court.teamA.score = 0;
    court.teamB.score = 0;
    court.isCompleted = false;
    court.winnerTeam = null;
    court.matchPointTeam = null;
    court.bracketMatchId = undefined;

    matchState.broadcast(courtMatchKey);
    await matchState.schedulePersistence(courtMatchKey);

    await this.syncAllCourtsWithBracket(bracketMatch.tournamentId);
    this.broadcastBracket(bracketMatch.tournamentId);

    return {
      success: true,
      winner: winnerTeamObj?.name,
      courtName: court.courtName,
      message: `Pertandingan selesai! ${winnerTeamObj?.name} lolos ke babak berikutnya. ${court.courtName} otomatis di-reset ke status menunggu.`,
    };
  }

  // Otomatis sinkronkan status meja dengan braket:
  // Hanya meja yang memiliki match LIVE dari braket yang aktif.
  // Semua meja yang belum dikirim match otomatis dikosongkan dan diset standby/menunggu.
  public async syncAllCourtsWithBracket(tournamentId?: string) {
    try {
      let activeTournament;
      if (tournamentId) {
        activeTournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
      } else {
        activeTournament = await prisma.tournament.findFirst({
          where: { status: { in: ["FINALIZED", "IN_PROGRESS", "DRAFT"] } },
          orderBy: { createdAt: "desc" },
        });
      }

      if (!activeTournament) return;

      const liveMatches = await prisma.bracketMatch.findMany({
        where: {
          tournamentId: activeTournament.id,
          status: "LIVE",
          courtMatchKey: { not: null },
        },
      });

      const activeCourtKeys = new Set(liveMatches.map((m) => m.courtMatchKey).filter(Boolean));

      for (const court of matchState.getAllMatches()) {
        if (!activeCourtKeys.has(court.matchKey)) {
          // Meja ini belum dikirim match dari braket -> OTOMATIS KOSONGKAN & SET MENUNGGU
          if (!court.isWaitingForNext || court.bracketMatchId) {
            matchState.setCourtWaitingState(court.matchKey, true);
          }
        } else {
          // Meja ini aktif bertanding dari braket
          const liveNode = liveMatches.find((m) => m.courtMatchKey === court.matchKey);
          if (liveNode && (court.isWaitingForNext || court.bracketMatchId !== liveNode.id)) {
            court.isWaitingForNext = false;
            court.bracketMatchId = liveNode.id;
            matchState.broadcast(court.matchKey);
            await matchState.schedulePersistence(court.matchKey);
          }
        }
      }
    } catch (err) {
      console.error("[BracketService] Error syncing court waiting states:", err);
    }
  }

  // 6. Get Complete Tournament Bracket
  public async getTournamentBracket(tournamentId?: string) {
    let tournament;
    if (tournamentId) {
      tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          matches: {
            include: { teamA: true, teamB: true },
            orderBy: [{ round: "asc" }, { matchOrder: "asc" }],
          },
        },
      });
    } else {
      // Find latest tournament
      tournament = await prisma.tournament.findFirst({
        orderBy: { createdAt: "desc" },
        include: {
          matches: {
            include: { teamA: true, teamB: true },
            orderBy: [{ round: "asc" }, { matchOrder: "asc" }],
          },
        },
      });
    }

    if (tournament) {
      await this.syncAllCourtsWithBracket(tournament.id);
    }

    return tournament;
  }

  // List all tournaments
  public async listTournaments() {
    return prisma.tournament.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { matches: true } },
      },
    });
  }
}

export const bracketService = new BracketService();
