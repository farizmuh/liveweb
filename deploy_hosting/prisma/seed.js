"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("🌱 Seeding database...");
    // 1. Create Default Superadmin
    const adminPassword = await bcryptjs_1.default.hash("admin123", 10);
    const admin = await prisma.user.upsert({
        where: { username: "admin" },
        update: {},
        create: {
            username: "admin",
            password: adminPassword,
            name: "Head Referee",
            role: client_1.Role.SUPERADMIN,
        },
    });
    console.log(`👤 Admin created/verified: ${admin.username} (password: admin123)`);
    // 2. Preset MPL Teams
    const teams = [
        { name: "FNATIC ONIC", shortName: "ONIC", colorHex: "#eab308" },
        { name: "RRQ HOSHI", shortName: "RRQ", colorHex: "#f97316" },
        { name: "EVOS GLORY", shortName: "EVOS", colorHex: "#3b82f6" },
        { name: "BIGETRON ALPHA", shortName: "BTR", colorHex: "#ef4444" },
        { name: "GEEK FAM", shortName: "GEEK", colorHex: "#10b981" },
        { name: "TEAM LIQUID ID", shortName: "TLID", colorHex: "#0284c7" },
        { name: "ALTER EGO", shortName: "AE", colorHex: "#7f1d1d" },
        { name: "DEWA UNITED", shortName: "DEWA", colorHex: "#a855f7" },
    ];
    for (const t of teams) {
        await prisma.team.upsert({
            where: { name: t.name },
            update: { shortName: t.shortName, colorHex: t.colorHex },
            create: {
                name: t.name,
                shortName: t.shortName,
                colorHex: t.colorHex,
            },
        });
    }
    console.log(`⚔️  ${teams.length} Team presets seeded.`);
    // 3. Create initial Match
    const onic = await prisma.team.findUnique({ where: { name: "FNATIC ONIC" } });
    const rrq = await prisma.team.findUnique({ where: { name: "RRQ HOSHI" } });
    const existingActiveMatch = await prisma.match.findFirst({ where: { isActive: true } });
    if (!existingActiveMatch) {
        await prisma.match.create({
            data: {
                tournamentName: "MPL INDONESIA SEASON 14",
                roundName: "GRAND FINALS",
                format: client_1.BoFormat.BO5,
                teamAId: onic?.id,
                teamAName: onic?.name || "FNATIC ONIC",
                teamAShort: onic?.shortName || "ONIC",
                scoreA: 0,
                teamBId: rrq?.id,
                teamBName: rrq?.name || "RRQ HOSHI",
                teamBShort: rrq?.shortName || "RRQ",
                scoreB: 0,
                isActive: true,
            },
        });
        console.log("🏆 Initial active match created.");
    }
    // 4. Global Settings
    await prisma.setting.upsert({
        where: { id: "global_config" },
        update: {},
        create: {
            id: "global_config",
            tickerText: "MPL INDONESIA • OFFICIAL ESPORTS TOURNAMENT BROADCAST • LIVE FROM ARENA",
            showTicker: true,
            showSponsor: false,
        },
    });
    console.log("⚙️  Global settings seeded.");
    console.log("✅ Seeding completed successfully!");
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
