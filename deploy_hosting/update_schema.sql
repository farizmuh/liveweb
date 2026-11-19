-- JALANKAN DI PHPMYADMIN (TAB SQL) DATABASE HOSTING ANDA:
ALTER TABLE `Team` ADD COLUMN IF NOT EXISTS `institution` VARCHAR(191) NULL;
ALTER TABLE `Match` ADD COLUMN IF NOT EXISTS `teamAInstitution` VARCHAR(191) NULL;
ALTER TABLE `Match` ADD COLUMN IF NOT EXISTS `teamBInstitution` VARCHAR(191) NULL;
ALTER TABLE `BracketMatch` ADD COLUMN IF NOT EXISTS `teamAInstitution` VARCHAR(191) NULL;
ALTER TABLE `BracketMatch` ADD COLUMN IF NOT EXISTS `teamBInstitution` VARCHAR(191) NULL;

-- Hapus index UNIQUE pada Team.name agar tim dengan nama sama dari sekolah berbeda diizinkan:
-- (Jika index sudah terhapus, Anda dapat mengabaikan jika muncul peringatan 'check that column/key exists')
ALTER TABLE `Team` DROP INDEX `Team_name_key`;
