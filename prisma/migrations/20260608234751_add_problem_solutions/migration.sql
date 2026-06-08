-- CreateTable
CREATE TABLE `problem_solutions` (
    `id` CHAR(36) NOT NULL,
    `problem_id` CHAR(36) NOT NULL,
    `explanation` LONGTEXT NOT NULL,
    `time_complexity` VARCHAR(50) NULL,
    `space_complexity` VARCHAR(50) NULL,
    `content_html` LONGTEXT NULL,
    `codeSnippets` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `problem_solutions_problem_id_key`(`problem_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `problem_solutions` ADD CONSTRAINT `problem_solutions_problem_id_fkey` FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
