CREATE TABLE `subscription_payment` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`plan_id` int NOT NULL,
	`amount` int NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`payment_method` varchar(20) NOT NULL DEFAULT 'qris',
	`payment_request_id` varchar(255) NOT NULL,
	`payment_number` varchar(255),
	`qr_string` text,
	`expires_at` timestamp,
	`paid_at` timestamp,
	`raw_response` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscription_payment_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_payment_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `subscription_payment_payment_request_id_unique` UNIQUE(`payment_request_id`)
);
--> statement-breakpoint
CREATE TABLE `subscription_plan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(50) NOT NULL,
	`price` int NOT NULL,
	`duration` int NOT NULL,
	`max_stores` int NOT NULL DEFAULT 1,
	`description` text,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscription_plan_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_plan_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `user_subscription` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`user_id` int NOT NULL,
	`plan_id` int NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`start_date` timestamp,
	`end_date` timestamp,
	`payment_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_subscription_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_subscription_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
ALTER TABLE `subscription_payment` ADD CONSTRAINT `subscription_payment_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_payment` ADD CONSTRAINT `subscription_payment_plan_id_subscription_plan_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plan`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_subscription` ADD CONSTRAINT `user_subscription_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_subscription` ADD CONSTRAINT `user_subscription_plan_id_subscription_plan_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plan`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_subscription` ADD CONSTRAINT `user_subscription_payment_id_subscription_payment_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `subscription_payment`(`id`) ON DELETE no action ON UPDATE no action;