import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import process from "node:process";

console.log("=======================================================");
console.log("📦 MEMBUAT PAKET HOSTING & FILE ZIP OTOMATIS");
console.log("=======================================================\n");

const rootDir = process.cwd();
const outDir = path.resolve(rootDir, "deploy_hosting");
const zipFile = path.resolve(rootDir, "deploy_hosting.zip");

// Pastikan PATH memiliki System32 untuk Windows
const sys32 = "C:\\Windows\\System32";
const sysRoot = process.env.SystemRoot || "C:\\Windows";
const currentPath = process.env.PATH || process.env.Path || "";
const fixedPath = `${sys32};${sysRoot};${sys32}\\WindowsPowerShell\\v1.0;${currentPath}`;
const env = { ...process.env, PATH: fixedPath, Path: fixedPath, ComSpec: `${sys32}\\cmd.exe` };

function run(cmd, cwd) {
  console.log(`▶ [${path.basename(cwd)}] ${cmd}`);
  execSync(cmd, { cwd, env, stdio: "inherit" });
}

// 1. Build Client
console.log("\n[1/6] Building Frontend Client (Vite -> dist)...");
run("npm run build", path.resolve(rootDir, "client"));

// 2. Generate Prisma Engines (Windows + Linux)
console.log("\n[2/6] Generating Prisma Client (dengan engine Linux untuk Hosting)...");
run("npx prisma generate", path.resolve(rootDir, "server"));

// 3. Build Server TypeScript
console.log("\n[3/6] Building Backend Server (TypeScript -> dist)...");
run("npm run build", path.resolve(rootDir, "server"));

// 4. Siapkan direktori deploy_hosting
console.log("\n[4/6] Menyiapkan struktur folder siap hosting...");
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

// Copy dist backend
fs.cpSync(path.resolve(rootDir, "server/dist"), path.resolve(outDir, "dist"), { recursive: true });

// Copy client/dist menjadi public/ di dalam deploy_hosting
fs.cpSync(path.resolve(rootDir, "client/dist"), path.resolve(outDir, "public"), { recursive: true });

// Copy prisma schema & migrations
fs.cpSync(path.resolve(rootDir, "server/prisma"), path.resolve(outDir, "prisma"), { recursive: true });

// Buat folder uploads kosong
fs.mkdirSync(path.resolve(outDir, "uploads"), { recursive: true });

// Buat app.js (Entry point kompatibel cPanel Passenger + LiteSpeed)
// PENTING: Passenger di cPanel MEMERLUKAN export "app" untuk mode autodetect
const appJsContent = `// Entry point for cPanel Node.js (Phusion Passenger)
// Passenger menggunakan file ini sebagai startup file.

// Pastikan environment variables tersedia
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env sebelum import apapun
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Import dan jalankan server
import('./dist/index.js');
`;
fs.writeFileSync(path.resolve(outDir, "app.js"), appJsContent);

// Buat production package.json (Hanya dependensi produksi, TANPA devDependencies!)
const prodPkg = {
  name: "esports-overlay-production",
  version: "1.0.0",
  type: "module",
  main: "dist/index.js",
  scripts: {
    "start": "node dist/index.js"
  },
  dependencies: {
    "@prisma/client": "^5.22.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.1",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "socket.io": "^4.8.1"
  }
};
fs.writeFileSync(path.resolve(outDir, "package.json"), JSON.stringify(prodPkg, null, 2));

// Buat template .env produksi (gunakan .env.example agar tidak menimpa .env yang sudah ada di server)
fs.writeFileSync(
  path.resolve(outDir, ".env.example"),
  `PORT=3000\nNODE_ENV=production\nDATABASE_URL="mysql://USER_DB:PASSWORD_DB@localhost:3306/NAMA_DB?connection_limit=3"\nJWT_SECRET="kunci-rahasia-esports-${Date.now()}"\nCORS_ORIGIN="*"\n`
);

// Buat script update SQL untuk phpMyAdmin hosting
const updateSql = `-- JALANKAN DI PHPMYADMIN (TAB SQL) DATABASE HOSTING ANDA:
ALTER TABLE \`Team\` ADD COLUMN IF NOT EXISTS \`institution\` VARCHAR(191) NULL;
ALTER TABLE \`Match\` ADD COLUMN IF NOT EXISTS \`teamAInstitution\` VARCHAR(191) NULL;
ALTER TABLE \`Match\` ADD COLUMN IF NOT EXISTS \`teamBInstitution\` VARCHAR(191) NULL;
ALTER TABLE \`BracketMatch\` ADD COLUMN IF NOT EXISTS \`teamAInstitution\` VARCHAR(191) NULL;
ALTER TABLE \`BracketMatch\` ADD COLUMN IF NOT EXISTS \`teamBInstitution\` VARCHAR(191) NULL;
`;
fs.writeFileSync(path.resolve(outDir, "update_schema.sql"), updateSql);

// Buat file .htaccess yang efektif untuk LiteSpeed + Passenger di cPanel
const htaccessContent = `# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION BEGIN
PassengerAppRoot "/home/ykxyeguk/live.smekid.my.id"
PassengerBaseURI "/"
PassengerNodejs "/home/ykxyeguk/nodevenv/live.smekid.my.id/20/bin/node"
PassengerAppType node
PassengerStartupFile app.js
PassengerAppLogFile "/home/ykxyeguk/live.smekid.my.id/passenger.log"
# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION END

# ==================================================================
# CPANEL NODE.JS APP - LITESPEED + PASSENGER CONFIGURATION
# ==================================================================
<IfModule Litespeed>
  SetEnv LSAPI_CHILDREN 1
  SetEnv LSAPI_AVOID_FORK 1
  SetEnv LSAPI_MAX_IDLE 60
  SetEnv LSAPI_PGRP_MAX_IDLE 120
  SetEnv LSAPI_MAX_PROCESS_TIME 3600
  SetEnv LSAPI_MAX_REQS 5000
</IfModule>

# Resource Limits
PassengerMaxInstances 1
PassengerMinInstances 1
PassengerPoolIdleTime 0
PassengerMaxRequestQueueSize 100
PassengerFriendlyErrorPages on

# Fallback Directory Index ke file Vite build
DirectoryIndex public/index.html index.html index.php

# Mencegah akses file sensitif
<FilesMatch "^\\.(env|htaccess|gitignore|log)">
  Order allow,deny
  Deny from all
</FilesMatch>
`;

fs.writeFileSync(path.resolve(outDir, ".htaccess"), htaccessContent);

// 5. Install production dependencies langsung di deploy_hosting
console.log("\n[5/6] Menginstall dependensi produksi saja (~50MB, tanpa TypeScript/Vite)...");
run("npm install --omit=dev", outDir);

// Copy juga prisma client yang sudah memiliki engine Linux ke deploy_hosting/node_modules/@prisma/client
const srcPrismaClient = path.resolve(rootDir, "server/node_modules/.prisma");
const destPrismaClient = path.resolve(outDir, "node_modules/.prisma");
if (fs.existsSync(srcPrismaClient)) {
  fs.cpSync(srcPrismaClient, destPrismaClient, { recursive: true });
}

// 6. Zip Otomatis
console.log("\n[6/6] Mengompresi seluruh paket menjadi deploy_hosting.zip...");
if (fs.existsSync(zipFile)) {
  fs.rmSync(zipFile, { force: true });
}

try {
  const tarExe = "C:\\Windows\\System32\\tar.exe";
  if (fs.existsSync(tarExe)) {
    execSync(`"${tarExe}" -a -c -f "${zipFile}" *`, { cwd: outDir, env, stdio: "inherit" });
  } else {
    const psExe = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
    execSync(`"${psExe}" -NoProfile -Command "Compress-Archive -Path '${outDir}\\*' -DestinationPath '${zipFile}' -Force"`, { env, stdio: "inherit" });
  }
  console.log("\n=======================================================");
  console.log(`🎉 BERHASIL! File ZIP siap upload:`);
  console.log(`📁 ${zipFile}`);
  console.log(`Ukuran file ini sangat kecil (~20MB) dan siap langsung di-upload ke cPanel.`);
  console.log("=======================================================\n");
} catch (err) {
  console.error("Gagal membuat zip otomatis:", err);
  console.log(`Silakan zip folder '${outDir}' secara manual.`);
}
