-- AlterTable
ALTER TABLE `access_logs` ADD COLUMN `metadata` JSON NULL DEFAULT ('{}');
