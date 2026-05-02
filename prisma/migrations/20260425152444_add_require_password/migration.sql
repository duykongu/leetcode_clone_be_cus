/*
  Warnings:

  - Made the column `password_hash` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `users` MODIFY `password_hash` VARCHAR(255) NOT NULL;
