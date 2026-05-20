/*
  Warnings:

  - You are about to alter the column `difficulty` on the `problems` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `Int`.

*/
-- AlterTable
ALTER TABLE `problems` MODIFY `difficulty` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revoked` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `problem_examples` (
    `id` CHAR(36) NOT NULL,
    `problem_id` CHAR(36) NOT NULL,
    `input` TEXT NOT NULL,
    `output` TEXT NOT NULL,
    `explanation` TEXT NULL,
    `order_index` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `problem_constraints` (
    `id` CHAR(36) NOT NULL,
    `problem_id` CHAR(36) NOT NULL,
    `content` TEXT NOT NULL,
    `order_index` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `problem_examples` ADD CONSTRAINT `problem_examples_problem_id_fkey` FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `problem_constraints` ADD CONSTRAINT `problem_constraints_problem_id_fkey` FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
