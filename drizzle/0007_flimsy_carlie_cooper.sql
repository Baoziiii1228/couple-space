CREATE TABLE `fitnessGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`targetWeight` decimal(5,2),
	`startWeight` decimal(5,2),
	`startDate` timestamp NOT NULL,
	`targetDate` timestamp,
	`weeklyExerciseGoal` int,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fitnessGoals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fitnessRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` timestamp NOT NULL,
	`weight` decimal(5,2),
	`exerciseType` varchar(50),
	`duration` int,
	`calories` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fitnessRecords_id` PRIMARY KEY(`id`)
);
