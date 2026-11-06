import { prisma } from "../config/db.js";
import { Server as SocketIOServer } from "socket.io";
import crypto from "crypto";

export interface ActiveMatchState {
  id: string;
  matchKey: string;
  courtName: string;
  tournamentName: string;
  roundName: string;
  format: "BO1" | "BO3" | "BO5" | "BO7";
  teamA: {
    id?: string | null;
    name: string;
    shortName: string;
    logoUrl?: string | null;
    colorHex?: string | null;
    score: number;
  };
  teamB: {
    id?: string | null;
    name: string;
    shortName: string;
    logoUrl?: string | null;
    colorHex?: string | null;
    score: number;
  };
  assignedRefereeId?: string | null;
  assignedRefereeName?: string | null;
  assignedRefereeUsername?: string | null;
  isCompleted: boolean;
  isWaitingForNext?: boolean;
  bracketMatchId?: string | null;
  winnerTeam?: "A" | "B" | null;
  matchPointTeam?: "A" | "B" | null;
  updatedAt: string;
}

export interface GlobalSettings {
  tickerText: string;
  showTicker: boolean;
  showSponsor: boolean;
}

class MatchStateManager {
  private io: SocketIOServer | null = null;
  // Map of matchKey -> ActiveMatchState
  private matches: Map<string, ActiveMatchState> = new Map();
  private settings: GlobalSettings = {
    tickerText: "MPL INDONESIA • OFFICIAL ESPORTS TOURNAMENT BROADCAST",
    showTicker: true,
    showSponsor: false,
  };
  private isSaving: boolean = false;
  private pendingSaves: Set<string> = new Set();

  public setSocketServer(io: SocketIOServer) {
    this.io = io;
  }

  public getSettings(): GlobalSettings {
    return this.settings;
  }

  public getAllMatches(): ActiveMatchState[] {
    return Array.from(this.matches.values());
  }

  public getMatchByKey(matchKey: string): ActiveMatchState | null {
    return this.matches.get(matchKey) || null;
  }

  public getMatchById(id: string): ActiveMatchState | null {
    for (const match of this.matches.values()) {
      if (match.id === id) return match;
    }
    return null;
  }

  public getMatchByRefereeId(refereeId: string): ActiveMatchState | null {
    for (const match of this.matches.values()) {
      if (match.assignedRefereeId === refereeId) return match;
    }
    // Fallback: return first match if none assigned
    return this.matches.values().next().value || null;
  }

  public getWinScore(format: string): number {
    switch (format) {
      case "BO1":
        return 1;
      case "BO3":
        return 2;
      case "BO5":
        return 3;
      case "BO7":
        return 4;
      default:
        return 2;
    }
  }

  private updateMatchStatus(match: ActiveMatchState) {
    const winScore = this.getWinScore(match.format);
    const scoreA = match.teamA.score;
    const scoreB = match.teamB.score;

    if (scoreA >= winScore) {
      match.isCompleted = true;
      match.winnerTeam = "A";
      match.matchPointTeam = null;
    } else if (scoreB >= winScore) {
      match.isCompleted = true;
      match.winnerTeam = "B";
      match.matchPointTeam = null;
    } else {
      match.isCompleted = false;
      match.winnerTeam = null;

      if (scoreA === winScore - 1 && scoreB < winScore - 1) {
        match.matchPointTeam = "A";
      } else if (scoreB === winScore - 1 && scoreA < winScore - 1) {
        match.matchPointTeam = "B";
      } else if (scoreA === winScore - 1 && scoreB === winScore - 1) {
        match.matchPointTeam = "A";
      } else {
        match.matchPointTeam = null;
      }
    }
    match.updatedAt = new Date().toISOString();
  }

  public async initializeFromDB() {
    try {
      this.matches.clear();

      // 1. Load all active matches from MySQL
      const dbMatches = await prisma.match.findMany({
        where: { isActive: true },
        include: { teamA: true, teamB: true, assignedReferee: true },
        orderBy: { courtName: "asc" },
      });

      if (dbMatches.length === 0) {
        // Fallback default match if empty
        const defaultKey = "match-" + crypto.randomBytes(3).toString("hex");
        const newMatch = await prisma.match.create({
          data: {
            matchKey: defaultKey,
            courtName: "Court 1",
            tournamentName: "MPL INDONESIA",
            roundName: "REGULAR SEASON",
            format: "BO3",
            teamAName: "FNATIC ONIC",
            teamAShort: "ONIC",
            teamBName: "RRQ HOSHI",
            teamBShort: "RRQ",
            isActive: true,
          },
          include: { teamA: true, teamB: true, assignedReferee: true },
        });
        dbMatches.push(newMatch);
      }

      for (const m of dbMatches) {
        const state: ActiveMatchState = {
          id: m.id,
          matchKey: m.matchKey,
          courtName: m.courtName,
          tournamentName: m.tournamentName,
          roundName: m.roundName,
          format: m.format as any,
          teamA: {
            id: m.teamAId,
            name: m.teamAName,
            shortName: m.teamAShort,
            logoUrl: m.teamALogo || m.teamA?.logoUrl,
            colorHex: m.teamA?.colorHex || "#2563eb",
            score: m.scoreA,
          },
          teamB: {
            id: m.teamBId,
            name: m.teamBName,
            shortName: m.teamBShort,
            logoUrl: m.teamBLogo || m.teamB?.logoUrl,
            colorHex: m.teamB?.colorHex || "#dc2626",
            score: m.scoreB,
          },
          assignedRefereeId: m.assignedRefereeId,
          assignedRefereeName: m.assignedReferee?.name,
          assignedRefereeUsername: m.assignedReferee?.username,
          isCompleted: m.isCompleted,
          isWaitingForNext: m.isWaitingForNext,
          bracketMatchId: m.bracketMatchId,
          winnerTeam: m.winnerTeam as any,
          matchPointTeam: null,
          updatedAt: m.updatedAt.toISOString(),
        };
        this.updateMatchStatus(state);
        this.matches.set(state.matchKey, state);
      }

      // 2. Load global settings
      let dbSettings = await prisma.setting.findUnique({
        where: { id: "global_config" },
      });
      if (dbSettings) {
        this.settings = {
          tickerText: dbSettings.tickerText,
          showTicker: dbSettings.showTicker,
          showSponsor: dbSettings.showSponsor,
        };
      }

      console.log(`[MatchState] Loaded ${this.matches.size} parallel active matches into memory.`);
    } catch (error) {
      console.error("[MatchState] Error loading state from DB:", error);
    }
  }

  // Broadcast to specific room (OBS & Referee of that matchKey) + Superadmin channel
  public broadcast(matchKey: string) {
    if (!this.io) return;
    const match = this.matches.get(matchKey);
    if (!match) return;

    // 1. Emit to room for this matchKey
    this.io.to(matchKey).emit("match:update", {
      match,
      settings: this.settings,
    });

    // 2. Emit overview to Superadmin dashboard
    this.io.to("superadmin_room").emit("matches:overview", {
      matches: this.getAllMatches(),
    });
  }

  public broadcastAll() {
    for (const key of this.matches.keys()) {
      this.broadcast(key);
    }
  }

  // Schedule async persistence for a specific match
  public async schedulePersistence(matchKey: string) {
    this.pendingSaves.add(matchKey);
    if (this.isSaving) return;

    this.isSaving = true;
    try {
      while (this.pendingSaves.size > 0) {
        const key = this.pendingSaves.values().next().value;
        if (!key) break;
        this.pendingSaves.delete(key);

        const match = this.matches.get(key);
        if (!match) continue;

        await prisma.match.update({
          where: { id: match.id },
          data: {
            courtName: match.courtName,
            tournamentName: match.tournamentName,
            roundName: match.roundName,
            format: match.format,
            teamAId: match.teamA.id,
            teamAName: match.teamA.name,
            teamAShort: match.teamA.shortName,
            teamALogo: match.teamA.logoUrl,
            scoreA: match.teamA.score,
            teamBId: match.teamB.id,
            teamBName: match.teamB.name,
            teamBShort: match.teamB.shortName,
            teamBLogo: match.teamB.logoUrl,
            scoreB: match.teamB.score,
            isCompleted: match.isCompleted,
            isWaitingForNext: match.isWaitingForNext ?? false,
            bracketMatchId: match.bracketMatchId ?? null,
            winnerTeam: match.winnerTeam,
            assignedRefereeId: match.assignedRefereeId,
          },
        });
      }

      if (this.io) {
        this.io.emit("db:synced", { status: "saved", timestamp: new Date().toISOString() });
      }
    } catch (err) {
      console.error("[MatchState] Error persisting match state:", err);
      if (this.io) {
        this.io.emit("db:synced", { status: "error", error: String(err) });
      }
    } finally {
      this.isSaving = false;
    }
  }

  // Actions
  public updateScore(matchKey: string, team: "A" | "B", delta: number) {
    const match = this.matches.get(matchKey);
    if (!match) return;

    const winScore = this.getWinScore(match.format);
    if (team === "A") {
      match.teamA.score = Math.max(0, Math.min(winScore, match.teamA.score + delta));
    } else {
      match.teamB.score = Math.max(0, Math.min(winScore, match.teamB.score + delta));
    }

    this.updateMatchStatus(match);
    this.broadcast(matchKey);
    this.schedulePersistence(matchKey);
  }

  public resetScore(matchKey: string) {
    const match = this.matches.get(matchKey);
    if (!match) return;

    match.teamA.score = 0;
    match.teamB.score = 0;
    match.isCompleted = false;
    match.winnerTeam = null;
    match.matchPointTeam = null;

    this.updateMatchStatus(match);
    this.broadcast(matchKey);
    this.schedulePersistence(matchKey);
  }

  public swapSide(matchKey: string) {
    const match = this.matches.get(matchKey);
    if (!match) return;

    const tempA = { ...match.teamA };
    match.teamA = { ...match.teamB };
    match.teamB = tempA;

    this.updateMatchStatus(match);
    this.broadcast(matchKey);
    this.schedulePersistence(matchKey);
  }

  public setCourtWaitingState(matchKey: string, isWaiting: boolean) {
    const match = this.matches.get(matchKey);
    if (!match) return;

    match.isWaitingForNext = isWaiting;
    if (isWaiting) {
      match.teamA.name = "TBD (Menunggu)";
      match.teamA.shortName = "TBD";
      match.teamA.logoUrl = null;
      match.teamA.score = 0;

      match.teamB.name = "TBD (Menunggu)";
      match.teamB.shortName = "TBD";
      match.teamB.logoUrl = null;
      match.teamB.score = 0;

      match.isCompleted = false;
      match.winnerTeam = null;
      match.matchPointTeam = null;
      match.bracketMatchId = null;
    }

    this.broadcast(matchKey);
    this.schedulePersistence(matchKey);
  }

  public resetUnassignedCourtsToWaiting() {
    for (const match of this.matches.values()) {
      if (!match.bracketMatchId) {
        this.setCourtWaitingState(match.matchKey, true);
      }
    }
  }

  public updateMatchConfig(matchKey: string, config: any) {
    const match = this.matches.get(matchKey);
    if (!match) return;

    if (config.courtName !== undefined) match.courtName = config.courtName;
    if (config.tournamentName !== undefined) match.tournamentName = config.tournamentName;
    if (config.roundName !== undefined) match.roundName = config.roundName;
    if (config.format !== undefined) {
      match.format = config.format;
      const winScore = this.getWinScore(config.format);
      if (match.teamA.score > winScore) match.teamA.score = winScore;
      if (match.teamB.score > winScore) match.teamB.score = winScore;
    }
    if (config.teamA) {
      match.teamA = { ...match.teamA, ...config.teamA };
    }
    if (config.teamB) {
      match.teamB = { ...match.teamB, ...config.teamB };
    }
    if (config.assignedRefereeId !== undefined) {
      match.assignedRefereeId = config.assignedRefereeId;
    }

    this.updateMatchStatus(match);
    this.broadcast(matchKey);
    this.schedulePersistence(matchKey);
  }

  public async registerNewMatch(matchData: any) {
    const matchKey = matchData.matchKey || "match-" + crypto.randomBytes(3).toString("hex");
    const created = await prisma.match.create({
      data: {
        matchKey,
        courtName: matchData.courtName || "Court",
        tournamentName: matchData.tournamentName || "MPL INDONESIA",
        roundName: matchData.roundName || "REGULAR SEASON",
        format: matchData.format || "BO3",
        teamAId: matchData.teamAId || null,
        teamAName: matchData.teamAName || "TEAM A",
        teamAShort: matchData.teamAShort || "A",
        scoreA: 0,
        teamBId: matchData.teamBId || null,
        teamBName: matchData.teamBName || "TEAM B",
        teamBShort: matchData.teamBShort || "B",
        scoreB: 0,
        assignedRefereeId: matchData.assignedRefereeId || null,
        isActive: true,
      },
      include: { teamA: true, teamB: true, assignedReferee: true },
    });

    const state: ActiveMatchState = {
      id: created.id,
      matchKey: created.matchKey,
      courtName: created.courtName,
      tournamentName: created.tournamentName,
      roundName: created.roundName,
      format: created.format as any,
      teamA: {
        id: created.teamAId,
        name: created.teamAName,
        shortName: created.teamAShort,
        logoUrl: created.teamALogo,
        colorHex: "#2563eb",
        score: 0,
      },
      teamB: {
        id: created.teamBId,
        name: created.teamBName,
        shortName: created.teamBShort,
        logoUrl: created.teamBLogo,
        colorHex: "#dc2626",
        score: 0,
      },
      assignedRefereeId: created.assignedRefereeId,
      assignedRefereeName: created.assignedReferee?.name,
      assignedRefereeUsername: created.assignedReferee?.username,
      isCompleted: false,
      winnerTeam: null,
      matchPointTeam: null,
      updatedAt: created.updatedAt.toISOString(),
    };

    this.matches.set(state.matchKey, state);
    this.broadcast(state.matchKey);
    return state;
  }

  public async updateSettings(newSettings: Partial<GlobalSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      await prisma.setting.upsert({
        where: { id: "global_config" },
        update: {
          tickerText: this.settings.tickerText,
          showTicker: this.settings.showTicker,
          showSponsor: this.settings.showSponsor,
        },
        create: {
          id: "global_config",
          tickerText: this.settings.tickerText,
          showTicker: this.settings.showTicker,
          showSponsor: this.settings.showSponsor,
        },
      });
    } catch (err) {
      console.error("[MatchState] Error saving settings:", err);
    }
    this.broadcastAll();
  }
}

export const matchState = new MatchStateManager();
