-- CreateTable
CREATE TABLE `admins` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'FRONT_DESK', 'TRAINER') NOT NULL DEFAULT 'FRONT_DESK',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admins_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `members` (
    `id` VARCHAR(191) NOT NULL,
    `member_no` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `gender` VARCHAR(191) NULL,
    `birthday` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'FROZEN', 'EXPIRED', 'BLACKLISTED') NOT NULL DEFAULT 'ACTIVE',
    `note` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `members_member_no_key`(`member_no`),
    UNIQUE INDEX `members_phone_key`(`phone`),
    INDEX `members_name_idx`(`name`),
    INDEX `members_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trainers` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `specialties` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `trainers_phone_key`(`phone`),
    INDEX `trainers_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `packages` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('TIME_CARD', 'VISIT_CARD', 'PT_CARD') NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `duration_days` INTEGER NULL,
    `total_visits` INTEGER NULL,
    `total_lessons` INTEGER NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `warning_days` INTEGER NOT NULL DEFAULT 7,
    `warning_visits` INTEGER NOT NULL DEFAULT 3,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `packages_type_active_idx`(`type`, `active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `member_cards` (
    `id` VARCHAR(191) NOT NULL,
    `member_id` VARCHAR(191) NOT NULL,
    `package_id` VARCHAR(191) NOT NULL,
    `card_no` VARCHAR(191) NOT NULL,
    `type` ENUM('TIME_CARD', 'VISIT_CARD', 'PT_CARD') NOT NULL,
    `status` ENUM('ACTIVE', 'EXPIRED', 'FROZEN', 'TRANSFERRED') NOT NULL DEFAULT 'ACTIVE',
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NULL,
    `total_visits` INTEGER NULL,
    `remaining_visits` INTEGER NULL,
    `total_lessons` INTEGER NULL,
    `remaining_lessons` INTEGER NULL,
    `source_card_id` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `member_cards_card_no_key`(`card_no`),
    INDEX `member_cards_member_id_status_idx`(`member_id`, `status`),
    INDEX `member_cards_package_id_idx`(`package_id`),
    INDEX `member_cards_end_date_idx`(`end_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `appointments` (
    `id` VARCHAR(191) NOT NULL,
    `member_id` VARCHAR(191) NOT NULL,
    `trainer_id` VARCHAR(191) NOT NULL,
    `member_card_id` VARCHAR(191) NOT NULL,
    `start_at` DATETIME(3) NOT NULL,
    `end_at` DATETIME(3) NOT NULL,
    `status` ENUM('BOOKED', 'CANCELLED', 'COMPLETED', 'ABSENT') NOT NULL DEFAULT 'BOOKED',
    `cancel_reason` VARCHAR(191) NULL,
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `appointments_member_id_start_at_idx`(`member_id`, `start_at`),
    INDEX `appointments_trainer_id_start_at_idx`(`trainer_id`, `start_at`),
    INDEX `appointments_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `access_logs` (
    `id` VARCHAR(191) NOT NULL,
    `member_id` VARCHAR(191) NULL,
    `member_card_id` VARCHAR(191) NULL,
    `direction` ENUM('IN', 'OUT') NOT NULL,
    `result` ENUM('ALLOWED', 'DENIED', 'ERROR', 'MANUAL') NOT NULL,
    `reason` VARCHAR(191) NULL,
    `happened_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `operator_id` VARCHAR(191) NULL,

    INDEX `access_logs_member_id_happened_at_idx`(`member_id`, `happened_at`),
    INDEX `access_logs_direction_result_happened_at_idx`(`direction`, `result`, `happened_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(191) NOT NULL,
    `member_id` VARCHAR(191) NOT NULL,
    `member_card_id` VARCHAR(191) NULL,
    `package_id` VARCHAR(191) NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `method` ENUM('CASH', 'WECHAT', 'ALIPAY', 'BANK_CARD', 'OTHER') NOT NULL,
    `biz_type` ENUM('OPEN_CARD', 'RENEW_CARD', 'CHANGE_CARD', 'ADD_VISITS', 'ADD_LESSONS', 'MANUAL') NOT NULL,
    `paid_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `remark` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payments_member_id_paid_at_idx`(`member_id`, `paid_at`),
    INDEX `payments_biz_type_idx`(`biz_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `member_presence` (
    `id` VARCHAR(191) NOT NULL,
    `member_id` VARCHAR(191) NOT NULL,
    `in_gym` BOOLEAN NOT NULL DEFAULT false,
    `last_in_at` DATETIME(3) NULL,
    `last_out_at` DATETIME(3) NULL,
    `corrected_by_id` VARCHAR(191) NULL,
    `correction_reason` VARCHAR(191) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `member_presence_member_id_key`(`member_id`),
    INDEX `member_presence_in_gym_idx`(`in_gym`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `member_cards` ADD CONSTRAINT `member_cards_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_cards` ADD CONSTRAINT `member_cards_package_id_fkey` FOREIGN KEY (`package_id`) REFERENCES `packages`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_cards` ADD CONSTRAINT `member_cards_source_card_id_fkey` FOREIGN KEY (`source_card_id`) REFERENCES `member_cards`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_trainer_id_fkey` FOREIGN KEY (`trainer_id`) REFERENCES `trainers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `appointments` ADD CONSTRAINT `appointments_member_card_id_fkey` FOREIGN KEY (`member_card_id`) REFERENCES `member_cards`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `access_logs` ADD CONSTRAINT `access_logs_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `access_logs` ADD CONSTRAINT `access_logs_member_card_id_fkey` FOREIGN KEY (`member_card_id`) REFERENCES `member_cards`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `access_logs` ADD CONSTRAINT `access_logs_operator_id_fkey` FOREIGN KEY (`operator_id`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_member_card_id_fkey` FOREIGN KEY (`member_card_id`) REFERENCES `member_cards`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_package_id_fkey` FOREIGN KEY (`package_id`) REFERENCES `packages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_presence` ADD CONSTRAINT `member_presence_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_presence` ADD CONSTRAINT `member_presence_corrected_by_id_fkey` FOREIGN KEY (`corrected_by_id`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
