-- AlterTable
ALTER TABLE `admins` ADD COLUMN `trainer_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `admins_trainer_id_key` ON `admins`(`trainer_id`);

-- AddForeignKey
ALTER TABLE `admins` ADD CONSTRAINT `admins_trainer_id_fkey` FOREIGN KEY (`trainer_id`) REFERENCES `trainers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
