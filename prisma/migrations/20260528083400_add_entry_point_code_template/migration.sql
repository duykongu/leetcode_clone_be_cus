/*
  Warnings:

  - You are about to alter the column `expires_at` on the `refresh_tokens` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `code_templates` ADD COLUMN `entry_point` VARCHAR(100) NULL DEFAULT 'main';

-- AlterTable
ALTER TABLE `refresh_tokens` MODIFY `expires_at` DATETIME NOT NULL;
