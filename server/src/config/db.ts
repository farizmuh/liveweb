import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("=================================================================");
  console.error("❌ ERROR FATAL: Variabel DATABASE_URL tidak ditemukan!");
  console.error("Pastikan file '.env' sudah ada di root folder hosting/server dan");
  console.error("berisi DATABASE_URL='mysql://USER:PASS@localhost:3306/NAMA_DB'");
  console.error("=================================================================");
} else if (!dbUrl.includes("connection_limit")) {
  const separator = dbUrl.includes("?") ? "&" : "?";
  dbUrl = `${dbUrl}${separator}connection_limit=3`;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

