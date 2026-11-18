import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverRequire = createRequire(path.resolve(__dirname, "server/package.json"));
const { PrismaClient } = serverRequire("@prisma/client");
const dotenv = serverRequire("dotenv");

dotenv.config({ path: path.resolve(__dirname, "server/.env") });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "mysql://root:@localhost:3306/esports_overlay",
    },
  },
});

async function main() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { matches: true } },
    },
  });

  console.log("Daftar Turnamen di Database:");
  tournaments.forEach((t, i) => {
    console.log(`[${i + 1}] ID: ${t.id} | Name: ${t.name} | Status: ${t.status} | Matches: ${t._count.matches} | Created: ${t.createdAt}`);
  });
}

main().finally(() => prisma.$disconnect());
