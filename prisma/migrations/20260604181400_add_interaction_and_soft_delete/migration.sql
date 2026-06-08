/*
  Warnings:

  - You are about to alter the column `expires_at` on the `refresh_tokens` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `discussions` ADD COLUMN `is_deleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `refresh_tokens` MODIFY `expires_at` DATETIME NOT NULL;

-- CreateTable
CREATE TABLE `user_discussion_interactions` (
    `user_id` CHAR(36) NOT NULL,
    `discussion_id` CHAR(36) NOT NULL,
    `vote_type` INTEGER NOT NULL DEFAULT 0,
    `is_saved` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`user_id`, `discussion_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_discussion_interactions` ADD CONSTRAINT `user_discussion_interactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_discussion_interactions` ADD CONSTRAINT `user_discussion_interactions_discussion_id_fkey` FOREIGN KEY (`discussion_id`) REFERENCES `discussions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
