-- ========================================================
-- QUERY UPDATE DATABASE (Jalankan di phpMyAdmin tab SQL)
-- Database Turnamen Esports Antar Sekolah
-- ========================================================

-- 1. Tambah kolom asal sekolah / instansi di tabel Team
ALTER TABLE `Team` ADD COLUMN IF NOT EXISTS `institution` VARCHAR(191) NULL;

-- 2. Tambah kolom asal sekolah di tabel Match (untuk Overlay Meja Pertandingan)
ALTER TABLE `Match` ADD COLUMN IF NOT EXISTS `teamAInstitution` VARCHAR(191) NULL;
ALTER TABLE `Match` ADD COLUMN IF NOT EXISTS `teamBInstitution` VARCHAR(191) NULL;

-- 3. Tambah kolom asal sekolah di tabel BracketMatch (untuk Bagan Turnamen)
ALTER TABLE `BracketMatch` ADD COLUMN IF NOT EXISTS `teamAInstitution` VARCHAR(191) NULL;
ALTER TABLE `BracketMatch` ADD COLUMN IF NOT EXISTS `teamBInstitution` VARCHAR(191) NULL;

-- 4. Hapus index UNIQUE pada nama tim (agar sekolah berbeda boleh memiliki nama tim yang sama)
-- Catatan: Jika saat dieksekusi muncul error bahwa index sudah tidak ada, Anda bisa melewatinya.
ALTER TABLE `Team` DROP INDEX `Team_name_key`;
