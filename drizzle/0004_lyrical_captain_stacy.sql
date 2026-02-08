CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`key` varchar(100) NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`gameType` varchar(50) NOT NULL,
	`content` json,
	`result` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gameRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hundredThings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`year` int NOT NULL,
	`thingIndex` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`completedBy` int,
	`note` text,
	`photoUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hundredThings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ledgerRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`creatorId` int NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`amount` varchar(20) NOT NULL,
	`category` varchar(50) NOT NULL,
	`description` text,
	`date` timestamp NOT NULL,
	`paidBy` enum('user1','user2','split','together') NOT NULL DEFAULT 'together',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ledgerRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `milestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`creatorId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`emoji` varchar(10),
	`eventDate` timestamp NOT NULL,
	`category` varchar(50),
	`relatedId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `milestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `todoLists` MODIFY COLUMN `type` enum('movie','restaurant','music','book','other') NOT NULL;--> statement-breakpoint
ALTER TABLE `verificationCodes` ADD `attemptCount` int DEFAULT 0 NOT NULL;