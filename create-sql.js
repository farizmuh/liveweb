import fs from "node:fs";
import path from "node:path";
import bcrypt from "./deploy_hosting/node_modules/bcryptjs/index.js";

const adminHash = bcrypt.hashSync("admin123", 10);
const wasitHash = bcrypt.hashSync("wasit123", 10);

const sql = `-- ========================================================
-- ESPORTS OVERLAY & SCOREBOARD DATABASE DUMP
-- Import file ini ke phpMyAdmin di Hosting (Database: ykxyeguk_live)
-- ========================================================

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- 1. Table: User
DROP TABLE IF EXISTS \`User\`;
CREATE TABLE \`User\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`username\` VARCHAR(191) NOT NULL,
  \`password\` VARCHAR(191) NOT NULL,
  \`name\` VARCHAR(191) NOT NULL,
  \`role\` ENUM('SUPERADMIN', 'REFEREE') NOT NULL DEFAULT 'REFEREE',
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`User_username_key\` (\`username\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`User\` (\`id\`, \`username\`, \`password\`, \`name\`, \`role\`) VALUES
('usr-admin-01', 'admin', '${adminHash}', 'Head Referee (Superadmin)', 'SUPERADMIN'),
('usr-wasit-01', 'wasit1', '${wasitHash}', 'Wasit Meja 1', 'REFEREE'),
('usr-wasit-02', 'wasit2', '${wasitHash}', 'Wasit Meja 2', 'REFEREE'),
('usr-wasit-03', 'wasit3', '${wasitHash}', 'Wasit Meja 3', 'REFEREE'),
('usr-wasit-04', 'wasit4', '${wasitHash}', 'Wasit Meja 4', 'REFEREE');

-- 2. Table: Team
DROP TABLE IF EXISTS \`Team\`;
CREATE TABLE \`Team\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`name\` VARCHAR(191) NOT NULL,
  \`shortName\` VARCHAR(191) NOT NULL,
  \`logoUrl\` VARCHAR(191) NULL,
  \`colorHex\` VARCHAR(191) NULL DEFAULT '#2563eb',
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`Team_name_key\` (\`name\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`Team\` (\`id\`, \`name\`, \`shortName\`, \`colorHex\`) VALUES
('tm-onic-01', 'FNATIC ONIC', 'ONIC', '#eab308'),
('tm-rrq-02', 'RRQ HOSHI', 'RRQ', '#f97316'),
('tm-evos-03', 'EVOS GLORY', 'EVOS', '#3b82f6'),
('tm-btr-04', 'BIGETRON ALPHA', 'BTR', '#ef4444'),
('tm-geek-05', 'GEEK FAM', 'GEEK', '#10b981'),
('tm-tlid-06', 'TEAM LIQUID ID', 'TLID', '#0284c7'),
('tm-ae-07', 'ALTER EGO', 'AE', '#7f1d1d'),
('tm-dewa-08', 'DEWA UNITED', 'DEWA', '#a855f7');

-- 3. Table: Tournament
DROP TABLE IF EXISTS \`Tournament\`;
CREATE TABLE \`Tournament\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`name\` VARCHAR(191) NOT NULL DEFAULT 'MPL INDONESIA COMMUNITY CUP',
  \`type\` ENUM('SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION') NOT NULL DEFAULT 'SINGLE_ELIMINATION',
  \`status\` ENUM('DRAFT', 'FINALIZED', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'DRAFT',
  \`format\` ENUM('BO1', 'BO3', 'BO5', 'BO7') NOT NULL DEFAULT 'BO3',
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table: BracketMatch
DROP TABLE IF EXISTS \`BracketMatch\`;
CREATE TABLE \`BracketMatch\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`tournamentId\` VARCHAR(191) NOT NULL,
  \`round\` INT NOT NULL,
  \`roundName\` VARCHAR(191) NOT NULL,
  \`section\` ENUM('UPPER', 'LOWER', 'GRAND_FINAL') NOT NULL DEFAULT 'UPPER',
  \`matchOrder\` INT NOT NULL,
  \`teamAId\` VARCHAR(191) NULL,
  \`teamAName\` VARCHAR(191) NULL,
  \`teamAShort\` VARCHAR(191) NULL,
  \`teamALogo\` VARCHAR(191) NULL,
  \`scoreA\` INT NOT NULL DEFAULT 0,
  \`teamBId\` VARCHAR(191) NULL,
  \`teamBName\` VARCHAR(191) NULL,
  \`teamBShort\` VARCHAR(191) NULL,
  \`teamBLogo\` VARCHAR(191) NULL,
  \`scoreB\` INT NOT NULL DEFAULT 0,
  \`isBye\` BOOLEAN NOT NULL DEFAULT FALSE,
  \`winnerTeam\` VARCHAR(191) NULL,
  \`winnerTeamId\` VARCHAR(191) NULL,
  \`status\` ENUM('PENDING', 'READY', 'LIVE', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
  \`nextMatchId\` VARCHAR(191) NULL,
  \`nextMatchSlot\` VARCHAR(191) NULL,
  \`loserMatchId\` VARCHAR(191) NULL,
  \`loserMatchSlot\` VARCHAR(191) NULL,
  \`assignedCourt\` VARCHAR(191) NULL,
  \`courtMatchKey\` VARCHAR(191) NULL,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`),
  KEY \`BracketMatch_tournamentId_idx\` (\`tournamentId\`),
  KEY \`BracketMatch_teamAId_idx\` (\`teamAId\`),
  KEY \`BracketMatch_teamBId_idx\` (\`teamBId\`),
  CONSTRAINT \`BracketMatch_tournamentId_fkey\` FOREIGN KEY (\`tournamentId\`) REFERENCES \`Tournament\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT \`BracketMatch_teamAId_fkey\` FOREIGN KEY (\`teamAId\`) REFERENCES \`Team\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT \`BracketMatch_teamBId_fkey\` FOREIGN KEY (\`teamBId\`) REFERENCES \`Team\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table: Match
DROP TABLE IF EXISTS \`Match\`;
CREATE TABLE \`Match\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`matchKey\` VARCHAR(191) NOT NULL,
  \`courtName\` VARCHAR(191) NOT NULL DEFAULT 'Court 1',
  \`tournamentName\` VARCHAR(191) NOT NULL DEFAULT 'MPL INDONESIA',
  \`roundName\` VARCHAR(191) NOT NULL DEFAULT 'REGULAR SEASON',
  \`format\` ENUM('BO1', 'BO3', 'BO5', 'BO7') NOT NULL DEFAULT 'BO3',
  \`teamAId\` VARCHAR(191) NULL,
  \`teamAName\` VARCHAR(191) NOT NULL DEFAULT 'BLUE TEAM',
  \`teamAShort\` VARCHAR(191) NOT NULL DEFAULT 'BLUE',
  \`teamALogo\` VARCHAR(191) NULL,
  \`scoreA\` INT NOT NULL DEFAULT 0,
  \`teamBId\` VARCHAR(191) NULL,
  \`teamBName\` VARCHAR(191) NOT NULL DEFAULT 'RED TEAM',
  \`teamBShort\` VARCHAR(191) NOT NULL DEFAULT 'RED',
  \`teamBLogo\` VARCHAR(191) NULL,
  \`scoreB\` INT NOT NULL DEFAULT 0,
  \`assignedRefereeId\` VARCHAR(191) NULL,
  \`isActive\` BOOLEAN NOT NULL DEFAULT TRUE,
  \`isCompleted\` BOOLEAN NOT NULL DEFAULT FALSE,
  \`isWaitingForNext\` BOOLEAN NOT NULL DEFAULT FALSE,
  \`bracketMatchId\` VARCHAR(191) NULL,
  \`winnerTeam\` VARCHAR(191) NULL,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`Match_matchKey_key\` (\`matchKey\`),
  KEY \`Match_teamAId_idx\` (\`teamAId\`),
  KEY \`Match_teamBId_idx\` (\`teamBId\`),
  KEY \`Match_assignedRefereeId_idx\` (\`assignedRefereeId\`),
  CONSTRAINT \`Match_teamAId_fkey\` FOREIGN KEY (\`teamAId\` ) REFERENCES \`Team\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT \`Match_teamBId_fkey\` FOREIGN KEY (\`teamBId\`) REFERENCES \`Team\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT \`Match_assignedRefereeId_fkey\` FOREIGN KEY (\`assignedRefereeId\`) REFERENCES \`User\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`Match\` (\`id\`, \`matchKey\`, \`courtName\`, \`tournamentName\`, \`roundName\`, \`format\`, \`teamAId\`, \`teamAName\`, \`teamAShort\`, \`teamBId\`, \`teamBName\`, \`teamBShort\`, \`assignedRefereeId\`, \`isActive\`, \`isWaitingForNext\`) VALUES
('match-01', 'match-c1-8f3a9b', 'Court 1 (Main Stage)', 'MPL INDONESIA S14', 'MATCH 1 - REGULAR', 'BO5', 'tm-onic-01', 'FNATIC ONIC', 'ONIC', 'tm-rrq-02', 'RRQ HOSHI', 'RRQ', 'usr-wasit-01', 1, 0),
('match-02', 'match-c2-7d2e4c', 'Court 2', 'MPL INDONESIA S14', 'MATCH 2 - REGULAR', 'BO3', 'tm-evos-03', 'EVOS GLORY', 'EVOS', 'tm-btr-04', 'BIGETRON ALPHA', 'BTR', 'usr-wasit-02', 1, 1),
('match-03', 'match-c3-5a1b9f', 'Court 3', 'MPL INDONESIA S14', 'MATCH 3 - REGULAR', 'BO3', 'tm-geek-05', 'GEEK FAM', 'GEEK', 'tm-tlid-06', 'TEAM LIQUID ID', 'TLID', 'usr-wasit-03', 1, 1),
('match-04', 'match-c4-3e9d8a', 'Court 4', 'MPL INDONESIA S14', 'MATCH 4 - REGULAR', 'BO3', 'tm-ae-07', 'ALTER EGO', 'AE', 'tm-dewa-08', 'DEWA UNITED', 'DEWA', 'usr-wasit-04', 1, 1);

-- 6. Table: Sponsor
DROP TABLE IF EXISTS \`Sponsor\`;
CREATE TABLE \`Sponsor\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`name\` VARCHAR(191) NOT NULL,
  \`logoUrl\` VARCHAR(191) NULL,
  \`order\` INT NOT NULL DEFAULT 0,
  \`isActive\` BOOLEAN NOT NULL DEFAULT TRUE,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Table: Setting
DROP TABLE IF EXISTS \`Setting\`;
CREATE TABLE \`Setting\` (
  \`id\` VARCHAR(191) NOT NULL DEFAULT 'global_config',
  \`tickerText\` VARCHAR(191) NOT NULL DEFAULT 'Welcome to the Tournament! • Subscribe & Follow our Social Media',
  \`showTicker\` BOOLEAN NOT NULL DEFAULT TRUE,
  \`showSponsor\` BOOLEAN NOT NULL DEFAULT FALSE,
  \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO \`Setting\` (\`id\`, \`tickerText\`, \`showTicker\`, \`showSponsor\`) VALUES
('global_config', 'MPL INDONESIA • 4 COURTS LIVE PARALLEL BROADCAST • TOURNAMENT ARENA', 1, 0);

SET FOREIGN_KEY_CHECKS=1;
COMMIT;
`;

const outputPath = path.resolve(process.cwd(), "database_import.sql");
fs.writeFileSync(outputPath, sql);

console.log("=======================================================");
console.log("✅ File database_import.sql berhasil dibuat!");
console.log(`📁 Lokasi: ${outputPath}`);
console.log("Import file ini ke phpMyAdmin di cPanel Anda.");
console.log("=======================================================");
