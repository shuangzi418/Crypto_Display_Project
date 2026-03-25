-- users.sql
-- Exported at 2026-03-23T05:24:30.939Z
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;
CREATE DATABASE IF NOT EXISTS `crypto_quiz` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `crypto_quiz`;
INSERT INTO `users` (`id`, `username`, `nickname`, `avatar`, `avatarStatus`, `nicknameStatus`, `email`, `password`, `score`, `role`, `createdAt`) VALUES
(1, 'admin', '', '', 'pending', 'pending', 'admin@example.com', '$2a$10$9/r1cW11Y726ZkoQsLEvb.Mh4YHADYUk7Oc0hGjk.eJbcUp5Zwtw6', 0, 'admin', '2026-03-23 03:57:25.000');

SET FOREIGN_KEY_CHECKS=1;
