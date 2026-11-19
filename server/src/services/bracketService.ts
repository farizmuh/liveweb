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
    institution?: string | null;
    score: number;
  };
  teamB?: {
    id?: string | null;
    name?: string | null;
    shortName?: string | null;
    logoUrl?: string | null;
    institution?: string | null;
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

  // Get base main stage size (highest power of 2 <= count, e.g. 9 -> 8, 5 -> 4)
  private getBaseMainStageSize(count: number): number {
    let p = 2;
    while (p * 2 <= count) {
      p *= 2;
    }
    return p;
  }

  // Get next power of 2 (e.g. 4, 8, 16, 32)
  private getBracketSize(count: number): number {
    if (count <= 2) return 2;
    if (count <= 4) return 4;
    if (count <= 8) return 8;
    if (count <= 16) return 16;
    return 32;
  }

  private getRoundName(round: number, totalRounds: number, section: string, hasPlayIn: boolean = false): string {
    if (section === "GRAND_FINAL") return "Grand Finals";
    if (round === 1 && hasPlayIn) return "Round 1";

    const remaining = totalRounds - round;
    if (remaining === 0) return section === "LOWER" ? "Lower Finals" : "Grand Finals";
    if (remaining === 1) return section === "LOWER" ? "Lower Semifinals" : "Semifinals";
    if (remaining === 2) return section === "LOWER" ? "Lower Quarterfinals" : "Quarterfinals";
    if (remaining === 3) return "Round of 16";
    if (remaining === 4) return "Round of 32";
    if (remaining === 5) return "Round of 64";
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

  // Helper untuk menentukan slot target di babak utama yang menerima pemenang Play-in
  private getPlayInTargetSlot(mainRoundMatchCount: number, playInIndex: number): { matchIndex: number; slot: "A" | "B" } {
    if (playInIndex < mainRoundMatchCount) {
      return {
        matchIndex: mainRoundMatchCount - 1 - playInIndex,
        slot: "B",
      };
    } else {
      return {
        matchIndex: mainRoundMatchCount - 1 - (playInIndex - mainRoundMatchCount),
        slot: "A",
      };
    }
  }

  // Generate Single Elimination dengan format Play-in berimbang (tanpa match hantu / BYE vs BYE)
  private async generateSingleElimination(tournamentId: string, teams: any[]) {
    const teamCount = teams.length;
    const baseSize = this.getBaseMainStageSize(teamCount);
    const extraTeams = teamCount - baseSize; // Jumlah match di Babak 1 (Play-in)
    const hasPlayIn = extraTeams > 0;

    const mainStageRounds = Math.log2(baseSize);
    const totalRounds = hasPlayIn ? mainStageRounds + 1 : mainStageRounds;

    // Matriks penyimpan node per ronde
    const roundsMatches: any[][] = [];

    // 1. Buat Grand Finals (Match #1) & Perebutan Juara 3 (Match #2) di Ronde Puncak
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

    const bronze = await prisma.bracketMatch.create({
      data: {
        tournamentId,
        round: totalRounds,
        roundName: "Perebutan Juara 3",
        section: "UPPER",
        matchOrder: 2,
        status: "PENDING",
      },
    });

    roundsMatches[totalRounds] = [finals, bronze];

    // 2. Buat babak-babak utama dari Semifinals mundur ke babak utama pertama
    const firstMainRound = hasPlayIn ? 2 : 1;
    for (let r = totalRounds - 1; r >= firstMainRound; r--) {
      const distFromFinal = totalRounds - r;
      const matchCount = Math.pow(2, distFromFinal);
      roundsMatches[r] = [];

      for (let m = 0; m < matchCount; m++) {
        const nextRoundIndex = Math.floor(m / 2);
        const nextMatch = roundsMatches[r + 1][nextRoundIndex];
        const nextSlot = m % 2 === 0 ? "A" : "B";

        const match = await prisma.bracketMatch.create({
          data: {
            tournamentId,
            round: r,
            roundName: this.getRoundName(r, totalRounds, "UPPER", hasPlayIn),
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

    // Hubungkan pecundang Semifinal 1 dan Semifinal 2 ke Perebutan Juara 3
    if (roundsMatches[totalRounds - 1]?.length === 2) {
      const semi1 = roundsMatches[totalRounds - 1][0];
      const semi2 = roundsMatches[totalRounds - 1][1];

      await prisma.bracketMatch.update({
        where: { id: semi1.id },
        data: { loserMatchId: bronze.id, loserMatchSlot: "A" },
      });
      await prisma.bracketMatch.update({
        where: { id: semi2.id },
        data: { loserMatchId: bronze.id, loserMatchSlot: "B" },
      });
    }

    // 3. Jika ada Play-in (hasPlayIn === true), buat Ronde 1 (Round 1)
    if (hasPlayIn) {
      roundsMatches[1] = [];
      const playInCount = extraTeams; // Misal 57 tim -> 25 match
      const mainRoundMatches = roundsMatches[2]; // Babak utama pertama (misal Round of 32)

      for (let m = 0; m < playInCount; m++) {
        const target = this.getPlayInTargetSlot(mainRoundMatches.length, m);
        const targetNextMatch = mainRoundMatches[target.matchIndex];

        const match = await prisma.bracketMatch.create({
          data: {
            tournamentId,
            round: 1,
            roundName: "Round 1",
            section: "UPPER",
            matchOrder: m + 1,
            status: "PENDING",
            nextMatchId: targetNextMatch.id,
            nextMatchSlot: target.slot,
          },
        });
        roundsMatches[1].push(match);
      }
    }

    // 4. Masukkan tim-tim ke dalam bagan secara adil dan seimbang
    await this.populateSingleEliminationTeams(tournamentId, roundsMatches, teams, hasPlayIn, extraTeams);
  }

  // Populate Single Elimination dengan distribusi tim yang berimbang
  private async populateSingleEliminationTeams(
    tournamentId: string,
    roundsMatches: any[][],
    teams: any[],
    hasPlayIn: boolean,
    extraTeams: number
  ) {
    if (!hasPlayIn) {
      // Pangkat 2 murni (2, 4, 8, 16): Semua tim masuk di Ronde 1
      const round1Matches = roundsMatches[1];
      for (let i = 0; i < round1Matches.length; i++) {
        const match = round1Matches[i];
        const teamA = teams[i * 2] || null;
        const teamB = teams[i * 2 + 1] || null;

        await prisma.bracketMatch.update({
          where: { id: match.id },
          data: {
            teamAId: teamA?.id || null,
            teamAName: teamA?.name || null,
            teamAShort: teamA?.shortName || null,
            teamALogo: teamA?.logoUrl || null,
            scoreA: 0,
            teamBId: teamB?.id || null,
            teamBName: teamB?.name || null,
            teamBShort: teamB?.shortName || null,
            teamBLogo: teamB?.logoUrl || null,
            scoreB: 0,
            status: teamA && teamB ? "READY" : "PENDING",
            isBye: false,
          },
        });
      }
      return;
    }

    // Ada Play-in (misal 57 tim: 50 tim di Ronde 1, 7 tim di Ronde 2/Round of 32)
    const playInMatches = roundsMatches[1];
    const mainMatches = roundsMatches[2];

    const playInTeamCount = extraTeams * 2;
    const playInTeams = teams.slice(0, playInTeamCount);
    const directTeams = teams.slice(playInTeamCount); // Tim-tim yang langsung menunggu di babak utama

    // 1. Isi Ronde 1 (Play-in)
    for (let i = 0; i < playInMatches.length; i++) {
      const match = playInMatches[i];
      const teamA = playInTeams[i * 2];
      const teamB = playInTeams[i * 2 + 1];

      await prisma.bracketMatch.update({
        where: { id: match.id },
        data: {
          teamAId: teamA.id,
          teamAName: teamA.name,
          teamAShort: teamA.shortName,
          teamALogo: teamA.logoUrl,
          scoreA: 0,
          teamBId: teamB.id,
          teamBName: teamB.name,
          teamBShort: teamB.shortName,
          teamBLogo: teamB.logoUrl,
          scoreB: 0,
          status: "READY",
          isBye: false,
        },
      });
    }

    // 2. Tentukan slot mana saja di Ronde 2 yang menunggu pemenang Ronde 1
    const pendingSlots = new Set<string>();
    for (let m = 0; m < extraTeams; m++) {
      const target = this.getPlayInTargetSlot(mainMatches.length, m);
      pendingSlots.add(`${target.matchIndex}_${target.slot}`);
    }

    // 3. Distribusikan directTeams ke slot-slot yang tersedia di babak utama (Ronde 2)
    let directIndex = 0;
    for (let m = 0; m < mainMatches.length; m++) {
      const match = mainMatches[m];
      let teamA: any = null;
      let teamB: any = null;

      // Slot A
      if (!pendingSlots.has(`${m}_A`) && directIndex < directTeams.length) {
        teamA = directTeams[directIndex++];
      }

      // Slot B
      if (!pendingSlots.has(`${m}_B`) && directIndex < directTeams.length) {
        teamB = directTeams[directIndex++];
      }

      const isBothReady = Boolean(teamA && teamB);

      await prisma.bracketMatch.update({
        where: { id: match.id },
        data: {
          teamAId: teamA?.id || null,
          teamAName: teamA?.name || null,
          teamAShort: teamA?.shortName || null,
          teamALogo: teamA?.logoUrl || null,
          scoreA: 0,
          teamBId: teamB?.id || null,
          teamBName: teamB?.name || null,
          teamBShort: teamB?.shortName || null,
          teamBLogo: teamB?.logoUrl || null,
          scoreB: 0,
          status: isBothReady ? "READY" : "PENDING",
          isBye: false,
        },
      });
    }
  }

  // Seed Round 1 untuk Double Elimination (dengan penanganan BYE otomatis)
  private async seedRound1(tournamentId: string, round1Matches: any[], teams: any[], bracketSize: number) {
    const slots: (any | null)[] = [...teams];
    while (slots.length < bracketSize) {
      slots.push(null);
    }

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
        status = "COMPLETED";
        winnerTeam = "A";
        winnerTeamId = teamA.id;
      } else if (!teamA && teamB) {
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
      updateData.teamAInstitution = team.institution || null;
    } else {
      updateData.teamBId = team.id;
      updateData.teamBName = team.name;
      updateData.teamBShort = team.shortName;
      updateData.teamBLogo = team.logoUrl;
      updateData.teamBInstitution = team.institution || null;
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

    // Ambil SEMUA ID tim yang terdaftar di turnamen ini (dari semua node)
    const allMatches = await prisma.bracketMatch.findMany({
      where: { tournamentId },
    });

    const teamIdSet = new Set<string>();
    for (const m of allMatches) {
      if (m.teamAId) teamIdSet.add(m.teamAId);
      if (m.teamBId) teamIdSet.add(m.teamBId);
    }

    const teamIds = Array.from(teamIdSet);
    if (teamIds.length < 2) {
      throw new Error("Tim tidak mencukupi untuk diacak.");
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

    // Reset SEMUA ronde agar bersih dari status lama
    await prisma.bracketMatch.updateMany({
      where: { tournamentId },
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
        isBye: false,
      },
    });

    // Ambil semua match terurut berdasarkan ronde dan matchOrder
    const allMatchesFresh = await prisma.bracketMatch.findMany({
      where: { tournamentId },
      orderBy: [{ round: "asc" }, { matchOrder: "asc" }],
    });

    const roundsMatches: any[][] = [];
    for (const m of allMatchesFresh) {
      if (!roundsMatches[m.round]) roundsMatches[m.round] = [];
      roundsMatches[m.round].push(m);
    }

    const teamCount = teams.length;
    const baseSize = this.getBaseMainStageSize(teamCount);
    const extraTeams = teamCount - baseSize;
    const hasPlayIn = extraTeams > 0;

    await this.populateSingleEliminationTeams(tournamentId, roundsMatches, teams, hasPlayIn, extraTeams);

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
      include: { tournament: true, teamA: true, teamB: true },
    });

    if (!bracketMatch) throw new Error("Pertandingan braket tidak ditemukan.");
    if (!bracketMatch.teamAId || !bracketMatch.teamBId) {
      throw new Error("Kedua tim harus sudah ditentukan sebelum dikirim ke meja.");
    }

    const court = matchState.getMatchByKey(courtMatchKey);
    if (!court) throw new Error("Meja/Court pertandingan tidak ditemukan.");

    // VALIDASI KETAT ANTI-TUMPUK / BUSY CHECK:
    // A. Jika meja saat ini berstatus STANDBY (MEJA KOSONG) di panel wasit/admin:
    if (court.isWaitingForNext || !court.bracketMatchId) {
      // Bersihkan semua pertandingan lama yang mungkin masih tersisa 'LIVE' di database pada meja ini
      await prisma.bracketMatch.updateMany({
        where: {
          courtMatchKey,
          status: "LIVE",
          id: { not: bracketMatchId },
        },
        data: {
          status: "READY",
          assignedCourt: null,
          courtMatchKey: null,
        },
      });
    } else {
      // B. Meja benar-benar sedang aktif bertanding (bukan standby) dengan match lain
      if (court.bracketMatchId !== bracketMatchId) {
        const activeMatchOnCourt = await prisma.bracketMatch.findUnique({
          where: { id: court.bracketMatchId },
        });
        const matchLabel = activeMatchOnCourt
          ? `${activeMatchOnCourt.teamAName || 'TBD'} vs ${activeMatchOnCourt.teamBName || 'TBD'}`
          : `${court.teamA?.name || 'A'} vs ${court.teamB?.name || 'B'}`;
        throw new Error(
          `${court.courtName} saat ini sedang aktif bertanding (${matchLabel}). Selesaikan atau tarik pertandingan tersebut terlebih dahulu sebelum menugaskan pertandingan baru.`
        );
      }
    }

    // Jika match ini sebelumnya ditugaskan ke meja lain, kosongkan meja sebelumnya
    if (bracketMatch.status === "LIVE" && bracketMatch.courtMatchKey && bracketMatch.courtMatchKey !== courtMatchKey) {
      matchState.setCourtWaitingState(bracketMatch.courtMatchKey, true);
    }

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
        institution: bracketMatch.teamAInstitution || bracketMatch.teamA?.institution || null,
      },
      teamB: {
        id: bracketMatch.teamBId,
        name: bracketMatch.teamBName || "TEAM B",
        shortName: bracketMatch.teamBShort || "B",
        logoUrl: bracketMatch.teamBLogo,
        institution: bracketMatch.teamBInstitution || bracketMatch.teamB?.institution || null,
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

  // 4b. Batal Kirim ke Meja (Unassign / Tarik Match Kembali ke READY)
  public async unassignMatchFromCourt(bracketMatchId: string) {
    const bracketMatch = await prisma.bracketMatch.findUnique({
      where: { id: bracketMatchId },
    });

    if (!bracketMatch) throw new Error("Pertandingan braket tidak ditemukan.");

    const courtKey = bracketMatch.courtMatchKey;

    // Kembalikan status match ke READY
    await prisma.bracketMatch.update({
      where: { id: bracketMatchId },
      data: {
        status: "READY",
        assignedCourt: null,
        courtMatchKey: null,
      },
    });

    // Jika meja tersebut di memori sedang memuat match ini, kosongkan meja ke standby
    if (courtKey) {
      const court = matchState.getMatchByKey(courtKey);
      if (court && court.bracketMatchId === bracketMatchId) {
        matchState.setCourtWaitingState(courtKey, true);
      }
    }

    if (bracketMatch.tournamentId) {
      await this.syncAllCourtsWithBracket(bracketMatch.tournamentId);
      this.broadcastBracket(bracketMatch.tournamentId);
    }

    return {
      success: true,
      message: `Pertandingan "${bracketMatch.teamAName} vs ${bracketMatch.teamBName}" berhasil ditarik dari meja. Meja kini kembali tersedia.`,
    };
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
  public async finishMatch(courtMatchKey?: string, bracketMatchId?: string) {
    let targetMatchId = bracketMatchId;

    if (!targetMatchId && courtMatchKey) {
      const court = matchState.getMatchByKey(courtMatchKey);
      targetMatchId = court?.bracketMatchId || undefined;
    }

    if (!targetMatchId) {
      throw new Error("ID pertandingan atau meja tidak ditemukan.");
    }

    const bracketMatch = await prisma.bracketMatch.findUnique({
      where: { id: targetMatchId },
      include: { teamA: true, teamB: true },
    });
    if (!bracketMatch) throw new Error("Node braket tidak ditemukan.");

    // Tentukan meja terkait
    const courtKey = bracketMatch.courtMatchKey || courtMatchKey;
    const court = courtKey ? matchState.getMatchByKey(courtKey) : null;

    let scoreA = bracketMatch.scoreA;
    let scoreB = bracketMatch.scoreB;

    if (court && court.bracketMatchId === bracketMatch.id) {
      scoreA = court.teamA.score;
      scoreB = court.teamB.score;
    }

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
    if (court && court.bracketMatchId === bracketMatch.id) {
      court.isWaitingForNext = true;
      court.teamA.score = 0;
      court.teamB.score = 0;
      court.isCompleted = false;
      court.winnerTeam = null;
      court.matchPointTeam = null;
      court.bracketMatchId = undefined;

      if (courtKey) {
        matchState.broadcast(courtKey);
        await matchState.schedulePersistence(courtKey);
      }
    }

    await this.syncAllCourtsWithBracket(bracketMatch.tournamentId);
    this.broadcastBracket(bracketMatch.tournamentId);

    return {
      success: true,
      winner: winnerTeamObj?.name,
      courtName: court?.courtName || bracketMatch.assignedCourt,
      message: `Pertandingan selesai! ${winnerTeamObj?.name} lolos ke babak berikutnya. Meja otomatis di-reset ke status menunggu.`,
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
          // Meja ini tidak memiliki match aktif di turnamen ini -> Bersihkan sisa LIVE di DB & set STANDBY
          await prisma.bracketMatch.updateMany({
            where: { courtMatchKey: court.matchKey, status: "LIVE" },
            data: {
              status: "READY",
              assignedCourt: null,
              courtMatchKey: null,
            },
          });
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

  // Memastikan Perebutan Juara 3 (Bronze Match) selalu ada di babak final Single Elimination
  public async ensureBronzeMatch(tournamentId: string) {
    try {
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: {
          matches: {
            include: { teamA: true, teamB: true },
            orderBy: [{ round: "asc" }, { matchOrder: "asc" }],
          },
        },
      });

      if (!tournament || tournament.matches.length === 0) return;
      if (tournament.type === "DOUBLE_ELIMINATION") return;

      const maxRound = Math.max(...tournament.matches.map((m) => m.round));
      // Cari apakah sudah ada Bronze Match / Perebutan Juara 3
      let bronze = tournament.matches.find(
        (m) =>
          m.round === maxRound &&
          (m.matchOrder === 2 ||
            m.roundName.toLowerCase().includes("juara 3") ||
            m.roundName.toLowerCase().includes("bronze"))
      );

      const semiRound = maxRound - 1;
      const semiMatches = tournament.matches
        .filter((m) => m.round === semiRound)
        .sort((a, b) => a.matchOrder - b.matchOrder);

      if (semiMatches.length < 2) return; // Belum mencapai struktur semifinal

      const semi1 = semiMatches[0];
      const semi2 = semiMatches[1];

      if (!bronze) {
        bronze = await prisma.bracketMatch.create({
          data: {
            tournamentId,
            round: maxRound,
            roundName: "Perebutan Juara 3",
            section: "UPPER",
            matchOrder: 2,
            status: "PENDING",
          },
          include: { teamA: true, teamB: true },
        });
      }

      // Pastikan Semifinal 1 & 2 terhubung ke loserMatchId
      if (semi1.loserMatchId !== bronze.id || semi1.loserMatchSlot !== "A") {
        await prisma.bracketMatch.update({
          where: { id: semi1.id },
          data: { loserMatchId: bronze.id, loserMatchSlot: "A" },
        });
      }

      if (semi2.loserMatchId !== bronze.id || semi2.loserMatchSlot !== "B") {
        await prisma.bracketMatch.update({
          where: { id: semi2.id },
          data: { loserMatchId: bronze.id, loserMatchSlot: "B" },
        });
      }

      // Sinkronkan tim yang gugur di Semifinal ke Bronze Match jika Semifinal sudah COMPLETED
      let updateBronze = false;
      const bronzeUpdateData: any = {};

      if (semi1.status === "COMPLETED" && semi1.winnerTeam) {
        const loser1Obj = semi1.winnerTeam === "A" ? semi1.teamB : semi1.teamA;
        if (loser1Obj && bronze.teamAId !== loser1Obj.id) {
          bronzeUpdateData.teamAId = loser1Obj.id;
          bronzeUpdateData.teamAName = loser1Obj.name;
          bronzeUpdateData.teamAShort = loser1Obj.shortName;
          bronzeUpdateData.teamALogo = loser1Obj.logoUrl;
          bronzeUpdateData.teamAInstitution = loser1Obj.institution || null;
          updateBronze = true;
        }
      }

      if (semi2.status === "COMPLETED" && semi2.winnerTeam) {
        const loser2Obj = semi2.winnerTeam === "A" ? semi2.teamB : semi2.teamA;
        if (loser2Obj && bronze.teamBId !== loser2Obj.id) {
          bronzeUpdateData.teamBId = loser2Obj.id;
          bronzeUpdateData.teamBName = loser2Obj.name;
          bronzeUpdateData.teamBShort = loser2Obj.shortName;
          bronzeUpdateData.teamBLogo = loser2Obj.logoUrl;
          bronzeUpdateData.teamBInstitution = loser2Obj.institution || null;
          updateBronze = true;
        }
      }

      const finalTeamA = bronzeUpdateData.teamAId || bronze.teamAId;
      const finalTeamB = bronzeUpdateData.teamBId || bronze.teamBId;
      if (finalTeamA && finalTeamB && bronze.status === "PENDING") {
        bronzeUpdateData.status = "READY";
        updateBronze = true;
      }

      if (updateBronze) {
        await prisma.bracketMatch.update({
          where: { id: bronze.id },
          data: bronzeUpdateData,
        });
      }
    } catch (err) {
      console.error("[BracketService] Error ensuring bronze match:", err);
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
      await this.ensureBronzeMatch(tournament.id);
      await this.syncAllCourtsWithBracket(tournament.id);

      // Ambil kembali tournament dengan data matches terbaru setelah ensureBronzeMatch
      tournament = await prisma.tournament.findUnique({
        where: { id: tournament.id },
        include: {
          matches: {
            include: { teamA: true, teamB: true },
            orderBy: [{ round: "asc" }, { matchOrder: "asc" }],
          },
        },
      });
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
