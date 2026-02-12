ALTER TABLE `periodRecords` ADD `flowLevel` int;--> statement-breakpoint
ALTER TABLE `periodRecords` ADD `temperature` varchar(10);--> statement-breakpoint
ALTER TABLE `periodRecords` ADD `weight` varchar(10);--> statement-breakpoint
ALTER TABLE `periodRecords` ADD `discharge` varchar(32);--> statement-breakpoint
ALTER TABLE `periodRecords` ADD `medication` json;