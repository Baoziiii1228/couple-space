CREATE TABLE `albums` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`coverUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `albums_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `anniversaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`title` varchar(100) NOT NULL,
	`date` timestamp NOT NULL,
	`isLunar` boolean NOT NULL DEFAULT false,
	`repeatType` enum('none','yearly','monthly') NOT NULL DEFAULT 'yearly',
	`reminderDays` int DEFAULT 3,
	`emoji` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `anniversaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `couples` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user1Id` int NOT NULL,
	`user2Id` int,
	`inviteCode` varchar(16) NOT NULL,
	`togetherDate` timestamp,
	`status` enum('pending','paired','dissolved') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `couples_id` PRIMARY KEY(`id`),
	CONSTRAINT `couples_inviteCode_unique` UNIQUE(`inviteCode`)
);
--> statement-breakpoint
CREATE TABLE `dailyQuotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`content` text NOT NULL,
	`author` varchar(100),
	`category` varchar(50),
	CONSTRAINT `dailyQuotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diaries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`authorId` int NOT NULL,
	`title` varchar(200),
	`content` text NOT NULL,
	`mood` varchar(50),
	`weather` varchar(50),
	`images` json,
	`isPrivate` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `diaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `diaryComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`diaryId` int NOT NULL,
	`authorId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `diaryComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `footprints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`creatorId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`latitude` varchar(20) NOT NULL,
	`longitude` varchar(20) NOT NULL,
	`address` text,
	`photos` json,
	`visitedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `footprints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`senderId` int NOT NULL,
	`content` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `moodRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`userId` int NOT NULL,
	`mood` enum('happy','excited','peaceful','sad','angry','anxious','tired','loving') NOT NULL,
	`note` text,
	`date` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `moodRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`albumId` int,
	`uploaderId` int NOT NULL,
	`url` text NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`caption` text,
	`takenAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`category` varchar(50),
	`isPreset` boolean NOT NULL DEFAULT false,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`completedBy` int,
	`photoUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timeCapsules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`senderId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`images` json,
	`openDate` timestamp NOT NULL,
	`isOpened` boolean NOT NULL DEFAULT false,
	`openedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `timeCapsules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `todoLists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`creatorId` int NOT NULL,
	`type` enum('movie','restaurant','other') NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`imageUrl` text,
	`rating` int,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `todoLists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wishes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`creatorId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`isCompleted` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wishes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` text;