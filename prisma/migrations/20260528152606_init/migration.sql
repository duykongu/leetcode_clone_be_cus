/*
  Warnings:

  - You are about to drop the column `entry_point` on the `code_templates` table. All the data in the column will be lost.
  - You are about to alter the column `expires_at` on the `refresh_tokens` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `code_templates` DROP COLUMN `entry_point`;

-- AlterTable
ALTER TABLE `problems` ADD COLUMN `metadata` JSON NULL;

-- AlterTable
ALTER TABLE `refresh_tokens` MODIFY `expires_at` DATETIME NOT NULL;
