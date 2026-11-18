import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gunakan require dengan basis direktori server/ agar module di server/node_modules ditemukan
const serverRequire = createRequire(path.resolve(__dirname, "server/package.json"));
const { PrismaClient } = serverRequire("@prisma/client");
const dotenv = serverRequire("dotenv");

dotenv.config({ path: path.resolve(__dirname, "server/.env") });
dotenv.config({ path: path.resolve(__dirname, ".env") });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "mysql://root:@localhost:3306/esports_overlay",
    },
  },
});

// Daftar 60 preset nama tim esport keren & profesional
const PRESET_TEAMS = [
  { name: "RRQ HOSHI", shortName: "RRQ", colorHex: "#ff9900" },
  { name: "ONIC ESPORTS", shortName: "ONIC", colorHex: "#facc15" },
  { name: "EVOS GLORY", shortName: "EVOS", colorHex: "#3b82f6" },
  { name: "ALTER EGO", shortName: "AE", colorHex: "#ef4444" },
  { name: "BIGETRON ALPHA", shortName: "BTR", colorHex: "#dc2626" },
  { name: "GEEK FAM", shortName: "GEEK", colorHex: "#b91c1c" },
  { name: "DEWA UNITED", shortName: "DEWA", colorHex: "#eab308" },
  { name: "TEAM LIQUID ID", shortName: "TLID", colorHex: "#0284c7" },
  { name: "REBELLION ZION", shortName: "RBL", colorHex: "#8b5cf6" },
  { name: "AURA FIRE", shortName: "AURA", colorHex: "#f97316" },
  { name: "BLACKLIST INT", shortName: "BLCK", colorHex: "#0f172a" },
  { name: "ECHO PHILIPPINES", shortName: "ECHO", colorHex: "#9333ea" },
  { name: "AP BREN", shortName: "BREN", colorHex: "#ca8a04" },
  { name: "RSG PHILIPPINES", shortName: "RSG", colorHex: "#059669" },
  { name: "TODAK ESPORTS", shortName: "TDK", colorHex: "#e11d48" },
  { name: "SELANGOR RED GIANTS", shortName: "SRG", colorHex: "#be123c" },
  { name: "HOMEBOIS", shortName: "HB", colorHex: "#10b981" },
  { name: "TEAM FLASH", shortName: "FL", colorHex: "#f59e0b" },
  { name: "FALCON ESPORTS", shortName: "FCON", colorHex: "#06b6d4" },
  { name: "BURN X FLASH", shortName: "BURN", colorHex: "#ea580c" },
  { name: "FIRE FLUX", shortName: "FF", colorHex: "#e11d48" },
  { name: "TEAM SECRET", shortName: "TS", colorHex: "#64748b" },
  { name: "TEAM SMG", shortName: "SMG", colorHex: "#ec4899" },
  { name: "MINANA EVOS", shortName: "MNNA", colorHex: "#2563eb" },
  { name: "DEUS VULT", shortName: "DEV", colorHex: "#6366f1" },
  { name: "TEAM VITALITY", shortName: "VIT", colorHex: "#eab308" },
  { name: "THE VALIANT", shortName: "VAL", colorHex: "#14b8a6" },
  { name: "BOOM ESPORTS", shortName: "BOOM", colorHex: "#000000" },
  { name: "MORPH TEAM", shortName: "MRPH", colorHex: "#0284c7" },
  { name: "OMEGA ESPORTS", shortName: "OMG", colorHex: "#16a34a" },
  { name: "KRAKEN ESPORTS", shortName: "KRK", colorHex: "#0891b2" },
  { name: "TITAN SQUAD", shortName: "TTN", colorHex: "#475569" },
  { name: "APEX PREDATORS", shortName: "APX", colorHex: "#f43f5e" },
  { name: "CYBER KNIGHTS", shortName: "CKN", colorHex: "#38bdf8" },
  { name: "SHADOW ASSASSINS", shortName: "SHD", colorHex: "#334155" },
  { name: "NOVA ESPORTS", shortName: "NOVA", colorHex: "#818cf8" },
  { name: "ECLIPSE REIGN", shortName: "ECL", colorHex: "#4f46e5" },
  { name: "NEBULA STARS", shortName: "NBL", colorHex: "#c084fc" },
  { name: "QUANTUM GAMING", shortName: "QTM", colorHex: "#22d3ee" },
  { name: "LUNAR ECLIPSE", shortName: "LNR", colorHex: "#94a3b8" },
  { name: "SOLARIS PRIDE", shortName: "SOL", colorHex: "#fbbf24" },
  { name: "VALKYRIE SQUAD", shortName: "VLK", colorHex: "#fb7185" },
  { name: "GLORY LEGION", shortName: "GLR", colorHex: "#fde047" },
  { name: "IRON FANG", shortName: "FANG", colorHex: "#71717a" },
  { name: "THUNDER BOLT", shortName: "THN", colorHex: "#38bdf8" },
  { name: "FROST BITE", shortName: "FRST", colorHex: "#7dd3fc" },
  { name: "BLISSER ESPORTS", shortName: "BLS", colorHex: "#a855f7" },
  { name: "STORM BREAKERS", shortName: "STRM", colorHex: "#0369a1" },
  { name: "VENOM CLAN", shortName: "VNM", colorHex: "#84cc16" },
  { name: "ALPHA WOLVES", shortName: "WLV", colorHex: "#64748b" },
  { name: "OMEGA SENTINELS", shortName: "SNT", colorHex: "#15803d" },
  { name: "ZEUS WARRIORS", shortName: "ZEUS", colorHex: "#f59e0b" },
  { name: "CHRONO GUILD", shortName: "CHR", colorHex: "#a855f7" },
  { name: "PHOENIX RISING", shortName: "PHXR", colorHex: "#ef4444" },
  { name: "VALOR ESPORTS", shortName: "VLR", colorHex: "#dc2626" },
  { name: "GENESIS CLAN", shortName: "GEN", colorHex: "#065f46" },
  { name: "HYDRA GAMING", shortName: "HYD", colorHex: "#0e7490" },
  { name: "OVERLORD GAMING", shortName: "OVL", colorHex: "#4338ca" },
  { name: "MYSTIC DRAGONS", shortName: "MYST", colorHex: "#b45309" },
  { name: "SUPER RINS", shortName: "RINS", colorHex: "#f59e0b" },
];

function getBaseMainStageSize(count) {
  let p = 2;
  while (p * 2 <= count) {
    p *= 2;
  }
  return p;
}

function getRoundName(round, totalRounds, hasPlayIn = false) {
  if (round === 1 && hasPlayIn) return "Round 1";
  const remaining = totalRounds - round;
  if (remaining === 0) return "Grand Finals";
  if (remaining === 1) return "Semifinals";
  if (remaining === 2) return "Quarterfinals";
  if (remaining === 3) return "Round of 16";
  if (remaining === 4) return "Round of 32";
  if (remaining === 5) return "Round of 64";
  return `Round ${round}`;
}

function getPlayInTargetSlot(mainRoundMatchCount, playInIndex) {
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

async function main() {
  console.log("==================================================================");
  console.log("🏆 SIMULASI BAGAN TURNAMEN 57 TIM (LOCAL HOST)");
  console.log("==================================================================\n");

  // 1. Pastikan minimal 57 tim ada di database
  console.log("[1/4] Menyiapkan database 57 Tim Esport...");
  const existingTeams = await prisma.team.findMany();
  console.log(`Ditemukan ${existingTeams.length} tim yang sudah ada.`);

  const needed = 57 - existingTeams.length;
  if (needed > 0) {
    console.log(`Menambahkan ${needed} tim baru agar total menjadi 57...`);
    const existingNames = new Set(existingTeams.map((t) => t.name.toUpperCase()));

    let addedCount = 0;
    for (const preset of PRESET_TEAMS) {
      if (existingTeams.length + addedCount >= 57) break;
      if (!existingNames.has(preset.name.toUpperCase())) {
        await prisma.team.create({
          data: {
            name: preset.name,
            shortName: preset.shortName,
            colorHex: preset.colorHex,
          },
        });
        existingNames.add(preset.name.toUpperCase());
        addedCount++;
      }
    }

    // Jika masih kurang, buat dummy squad
    let dummyIdx = 1;
    while (existingTeams.length + addedCount < 57) {
      const dummyName = `SQUAD S${dummyIdx.toString().padStart(2, "0")}`;
      if (!existingNames.has(dummyName)) {
        await prisma.team.create({
          data: {
            name: dummyName,
            shortName: `S${dummyIdx}`,
            colorHex: "#2563eb",
          },
        });
        existingNames.add(dummyName);
        addedCount++;
      }
      dummyIdx++;
    }
  }

  const all57Teams = await prisma.team.findMany({ take: 57 });
  console.log(`✅ Siap! Total tim yang digunakan untuk turnamen: ${all57Teams.length} tim.`);

  // 2. Buat Record Tournament baru
  console.log("\n[2/4] Membuat turnamen baru: 'MPL REGIONAL CUP 2026 (57 TIM)'...");
  const tournament = await prisma.tournament.create({
    data: {
      name: "MPL REGIONAL CUP 2026 (57 TIM)",
      type: "SINGLE_ELIMINATION",
      status: "DRAFT",
      format: "BO3",
    },
  });

  // 3. Hitung Algoritma Turnamen 57 Tim
  const teamCount = all57Teams.length; // 57
  const baseSize = getBaseMainStageSize(teamCount); // 32
  const extraTeams = teamCount - baseSize; // 25 (Jumlah match di Round 1)
  const hasPlayIn = extraTeams > 0; // true

  const mainStageRounds = Math.log2(baseSize); // 5 (Round of 32, 16, QF, SF, GF)
  const totalRounds = hasPlayIn ? mainStageRounds + 1 : mainStageRounds; // 6

  console.log(`\n[3/4] Mengenerate struktur bagan seimbang:`);
  console.log(` - Total Tim: ${teamCount} Tim`);
  console.log(` - Ukuran Babak Utama (Round of 32): ${baseSize} Tim`);
  console.log(` - Babak 1 (Round 1 / Play-in): ${extraTeams} Match (${extraTeams * 2} Tim bertanding)`);
  console.log(` - Tim Lolos Langsung (Dapat BYE ke Round of 32): ${teamCount - extraTeams * 2} Tim`);
  console.log(` - Total Babak: ${totalRounds} Babak`);

  const roundsMatches = [];

  // A. Buat Grand Finals (Ronde 6)
  const finals = await prisma.bracketMatch.create({
    data: {
      tournamentId: tournament.id,
      round: totalRounds,
      roundName: "Grand Finals",
      section: "UPPER",
      matchOrder: 1,
      status: "PENDING",
    },
  });
  roundsMatches[totalRounds] = [finals];

  // B. Buat babak-babak utama dari Semifinals mundur ke Round of 32 (Ronde 5 down to 2)
  const firstMainRound = hasPlayIn ? 2 : 1;
  for (let r = totalRounds - 1; r >= firstMainRound; r--) {
    const distFromFinal = totalRounds - r;
    const matchCount = Math.pow(2, distFromFinal);
    roundsMatches[r] = [];

    const rName = getRoundName(r, totalRounds, hasPlayIn);

    for (let m = 0; m < matchCount; m++) {
      const nextRoundIndex = Math.floor(m / 2);
      const nextMatch = roundsMatches[r + 1][nextRoundIndex];
      const nextSlot = m % 2 === 0 ? "A" : "B";

      const match = await prisma.bracketMatch.create({
        data: {
          tournamentId: tournament.id,
          round: r,
          roundName: rName,
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

  // C. Buat Ronde 1 (Play-in: 25 Match)
  roundsMatches[1] = [];
  const playInCount = extraTeams;
  const mainRoundMatches = roundsMatches[2]; // Round of 32 (16 Match)

  for (let m = 0; m < playInCount; m++) {
    const target = getPlayInTargetSlot(mainRoundMatches.length, m);
    const targetNextMatch = mainRoundMatches[target.matchIndex];

    const match = await prisma.bracketMatch.create({
      data: {
        tournamentId: tournament.id,
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

  // 4. Masukkan tim-tim ke dalam slot secara adil
  console.log("\n[4/4] Mendistribusikan 57 tim ke slot masing-masing...");
  const playInTeamCount = extraTeams * 2; // 50 tim
  const playInTeams = all57Teams.slice(0, playInTeamCount);
  const directTeams = all57Teams.slice(playInTeamCount); // 7 tim

  // Isi Round 1 (25 Match)
  const playInMatches = roundsMatches[1];
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

  // Tentukan pendingSlots di Round of 32
  const pendingSlots = new Set();
  for (let m = 0; m < extraTeams; m++) {
    const target = getPlayInTargetSlot(mainRoundMatches.length, m);
    pendingSlots.add(`${target.matchIndex}_${target.slot}`);
  }

  // Isi directTeams (7 tim) ke Round of 32
  let directIndex = 0;
  for (let m = 0; m < mainRoundMatches.length; m++) {
    const match = mainRoundMatches[m];
    let teamA = null;
    let teamB = null;

    if (!pendingSlots.has(`${m}_A`) && directIndex < directTeams.length) {
      teamA = directTeams[directIndex++];
    }
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

  // Hitung total match yang berhasil dibuat
  const totalMatchesCount = await prisma.bracketMatch.count({
    where: { tournamentId: tournament.id },
  });

  console.log("==================================================================");
  console.log("🎉 BERHASIL MEMBUAT SIMULASI BAGAN 57 TIM!");
  console.log(`📌 Turnamen ID : ${tournament.id}`);
  console.log(`📌 Nama        : ${tournament.name}`);
  console.log(`📌 Total Match : ${totalMatchesCount} Pertandingan (Tepat 57 - 1 = 56 match)`);
  console.log("\nRincian Babak:");
  console.log(" 1. Round 1      : 25 Pertandingan (50 Tim Bertanding)");
  console.log(" 2. Round of 32  : 16 Pertandingan (7 Tim Menunggu + 25 Pemenang R1)");
  console.log(" 3. Round of 16  : 8 Pertandingan");
  console.log(" 4. Quarterfinals: 4 Pertandingan");
  console.log(" 5. Semifinals   : 2 Pertandingan");
  console.log(" 6. Grand Finals : 1 Pertandingan");
  console.log("==================================================================");
  console.log("👉 Silakan buka browser Anda di http://localhost:3000/bracket");
  console.log("   dan refresh halaman untuk melihat bagan 57 tim ini!");
  console.log("==================================================================\n");
}

main()
  .catch((e) => {
    console.error("Error menjalankan simulasi:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
