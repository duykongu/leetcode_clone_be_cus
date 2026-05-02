-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NULL,
    `avatar_url` VARCHAR(500) NULL,
    `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    `solved_count` INTEGER NOT NULL DEFAULT 0,
    `streak_days` INTEGER NOT NULL DEFAULT 0,
    `last_active` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oauth_accounts` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `provider` VARCHAR(32) NOT NULL,
    `provider_uid` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `oauth_accounts_provider_provider_uid_key`(`provider`, `provider_uid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tags` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `slug` VARCHAR(50) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tags_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `problems` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` LONGTEXT NOT NULL,
    `difficulty` ENUM('easy', 'medium', 'hard') NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `acceptance_rate` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `total_accepted` INTEGER NOT NULL DEFAULT 0,
    `total_submitted` INTEGER NOT NULL DEFAULT 0,
    `created_by` CHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `problems_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `problem_tags` (
    `problem_id` CHAR(36) NOT NULL,
    `tag_id` CHAR(36) NOT NULL,

    PRIMARY KEY (`problem_id`, `tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `test_cases` (
    `id` CHAR(36) NOT NULL,
    `problem_id` CHAR(36) NOT NULL,
    `input` LONGTEXT NOT NULL,
    `expected_output` LONGTEXT NOT NULL,
    `is_hidden` BOOLEAN NOT NULL DEFAULT false,
    `order_index` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `code_templates` (
    `id` CHAR(36) NOT NULL,
    `problem_id` CHAR(36) NOT NULL,
    `language` ENUM('cpp', 'java', 'python', 'javascript', 'typescript', 'go', 'rust') NOT NULL,
    `starter_code` LONGTEXT NOT NULL,
    `solution_code` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `code_templates_problem_id_language_key`(`problem_id`, `language`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `submissions` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `problem_id` CHAR(36) NOT NULL,
    `language` ENUM('cpp', 'java', 'python', 'javascript', 'typescript', 'go', 'rust') NOT NULL,
    `code` LONGTEXT NOT NULL,
    `status` ENUM('pending', 'running', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compile_error') NOT NULL DEFAULT 'pending',
    `runtime_ms` INTEGER NULL,
    `memory_kb` INTEGER NULL,
    `passed_cases` INTEGER NOT NULL DEFAULT 0,
    `total_cases` INTEGER NOT NULL DEFAULT 0,
    `error_message` TEXT NULL,
    `submitted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_problem_status` (
    `user_id` CHAR(36) NOT NULL,
    `problem_id` CHAR(36) NOT NULL,
    `is_solved` BOOLEAN NOT NULL DEFAULT false,
    `best_runtime` INTEGER NULL,
    `best_memory` INTEGER NULL,
    `first_solved` DATETIME(3) NULL,
    `last_submitted` DATETIME(3) NOT NULL,

    PRIMARY KEY (`user_id`, `problem_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `oauth_accounts` ADD CONSTRAINT `oauth_accounts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `problems` ADD CONSTRAINT `problems_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `problem_tags` ADD CONSTRAINT `problem_tags_problem_id_fkey` FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `problem_tags` ADD CONSTRAINT `problem_tags_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `test_cases` ADD CONSTRAINT `test_cases_problem_id_fkey` FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `code_templates` ADD CONSTRAINT `code_templates_problem_id_fkey` FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `submissions` ADD CONSTRAINT `submissions_problem_id_fkey` FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_problem_status` ADD CONSTRAINT `user_problem_status_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_problem_status` ADD CONSTRAINT `user_problem_status_problem_id_fkey` FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
