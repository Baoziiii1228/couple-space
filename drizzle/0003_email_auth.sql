-- 添加password字段到users表
ALTER TABLE `users` ADD COLUMN `password` varchar(255);

-- 创建验证码表
CREATE TABLE IF NOT EXISTS `verificationCodes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `email` varchar(320) NOT NULL,
  `code` varchar(6) NOT NULL,
  `type` enum('login','register','reset') NOT NULL,
  `expiresAt` timestamp NOT NULL,
  `used` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `verificationCodes_id` PRIMARY KEY(`id`)
);
