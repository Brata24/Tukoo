CREATE TABLE `merchant` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(63) NOT NULL,
	`address` text NOT NULL,
	`logo` varchar(255) NOT NULL DEFAULT '',
	`primary_color` varchar(7) NOT NULL,
	`secondary_color` varchar(7) NOT NULL,
	`slogan` varchar(150) NOT NULL DEFAULT '',
	`user_id` int NOT NULL,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `merchant_id` PRIMARY KEY(`id`),
	CONSTRAINT `merchant_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `merchant` ADD CONSTRAINT `merchant_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;