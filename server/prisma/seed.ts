import { PrismaClient, Role, BoFormat } from "@prisma/client";
import bcrypt from "bcryptjs";
import process from "node:process";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database for 4 Parallel Matches...");

  // 1. Create Head Referee / Superadmin
  const adminPassword = await bcrypt.hash("admin123", 10);
  const refereePassword = await bcrypt.hash("wasit123", 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: adminPassword,
      name: "Head Referee (Superadmin)",
      role: Role.SUPERADMIN,
    },
  });
  console.log(`👤 Admin created/verified: ${admin.username} (admin123)`);

  // 2. Create 4 Referee Accounts
  const referees = [];
  for (let i = 1; i <= 4; i++) {
    const ref = await prisma.user.upsert({
      where: { username: `wasit${i}` },
      update: {},
      create: {
        username: `wasit${i}`,
        password: refereePassword,
        name: `Wasit Meja ${i}`,
        role: Role.REFEREE,
      },
    });
    referees.push(ref);
    console.log(`👤 Referee ${i} created: ${ref.username} (wasit123)`);
  }

  // 3. Preset MPL Teams
  const teamsData = [
    { name: "FNATIC ONIC", shortName: "ONIC", colorHex: "#eab308" },
    { name: "RRQ HOSHI", shortName: "RRQ", colorHex: "#f97316" },
    { name: "EVOS GLORY", shortName: "EVOS", colorHex: "#3b82f6" },
    { name: "BIGETRON ALPHA", shortName: "BTR", colorHex: "#ef4444" },
    { name: "GEEK FAM", shortName: "GEEK", colorHex: "#10b981" },
    { name: "TEAM LIQUID ID", shortName: "TLID", colorHex: "#0284c7" },
    { name: "ALTER EGO", shortName: "AE", colorHex: "#7f1d1d" },
    { name: "DEWA UNITED", shortName: "DEWA", colorHex: "#a855f7" },
  ];

  const teamsMap = new Map();
  for (const t of teamsData) {
    const team = await prisma.team.upsert({
      where: { name: t.name },
      update: { shortName: t.shortName, colorHex: t.colorHex },
      create: {
        name: t.name,
        shortName: t.shortName,
        colorHex: t.colorHex,
      },
    });
    teamsMap.set(t.shortName, team);
  }
  console.log(`⚔️  ${teamsData.length} Team presets seeded.`);

  // 4. Create 4 Parallel Matches
  const parallelMatches = [
    {
      courtName: "Court 1 (Main Stage)",
      matchKey: "match-c1-8f3a9b",
      tournamentName: "MPL INDONESIA S14",
      roundName: "MATCH 1 - REGULAR",
      format: BoFormat.BO5,
      teamA: teamsMap.get("ONIC"),
      teamB: teamsMap.get("RRQ"),
      referee: referees[0],
    },
    {
      courtName: "Court 2",
      matchKey: "match-c2-7d2e4c",
      tournamentName: "MPL INDONESIA S14",
      roundName: "MATCH 2 - REGULAR",
      format: BoFormat.BO3,
      teamA: teamsMap.get("EVOS"),
      teamB: teamsMap.get("BTR"),
      referee: referees[1],
    },
    {
      courtName: "Court 3",
      matchKey: "match-c3-5a1b9f",
      tournamentName: "MPL INDONESIA S14",
      roundName: "MATCH 3 - REGULAR",
      format: BoFormat.BO3,
      teamA: teamsMap.get("GEEK"),
      teamB: teamsMap.get("TLID"),
      referee: referees[2],
    },
    {
      courtName: "Court 4",
      matchKey: "match-c4-3e9d8a",
      tournamentName: "MPL INDONESIA S14",
      roundName: "MATCH 4 - REGULAR",
      format: BoFormat.BO3,
      teamA: teamsMap.get("AE"),
      teamB: teamsMap.get("DEWA"),
      referee: referees[3],
    },
  ];

  for (const pm of parallelMatches) {
    await prisma.match.upsert({
      where: { matchKey: pm.matchKey },
      update: {
        courtName: pm.courtName,
        assignedRefereeId: pm.referee.id,
        isActive: true,
      },
      create: {
        courtName: pm.courtName,
        matchKey: pm.matchKey,
        tournamentName: pm.tournamentName,
        roundName: pm.roundName,
        format: pm.format,
        teamAId: pm.teamA?.id,
        teamAName: pm.teamA?.name || "TEAM A",
        teamAShort: pm.teamA?.shortName || "A",
        scoreA: 0,
        teamBId: pm.teamB?.id,
        teamBName: pm.teamB?.name || "TEAM B",
        teamBShort: pm.teamB?.shortName || "B",
        scoreB: 0,
        assignedRefereeId: pm.referee.id,
        isActive: true,
      },
    });
    console.log(`🏟️  Parallel Match Seeded: ${pm.courtName} -> Key: ${pm.matchKey} -> Assigned to: ${pm.referee.username}`);
  }

  // 5. Global Settings
  await prisma.setting.upsert({
    where: { id: "global_config" },
    update: {},
    create: {
      id: "global_config",
      tickerText: "MPL INDONESIA • 4 COURTS LIVE PARALLEL BROADCAST • TOURNAMENT ARENA",
      showTicker: true,
      showSponsor: false,
    },
  });

  console.log("✅ Seeding for 4 parallel matches completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
