CREATE TABLE `countdowns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`targetDate` timestamp NOT NULL,
	`type` enum('milestone','meetup','custom') NOT NULL,
	`description` text,
	`emoji` varchar(10),
	`isCompleted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `countdowns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `promises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`coupleId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`status` enum('pending','completed','confirmed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`confirmedAt` timestamp,
	`confirmedBy` int,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `promises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `todoLists` MODIFY COLUMN `type` enum('movie','tv','restaurant','music','book','travel','activity','other') NOT NULL;--> statement-breakpoint
ALTER TABLE `moodRecords` ADD `images` json;--> statement-breakpoint
ALTER TABLE `tasks` ADD `startTime` timestamp;--> statement-breakpoint
ALTER TABLE `tasks` ADD `deadline` timestamp;--> statement-breakpoint
ALTER TABLE `todoLists` ADD `tags` json;