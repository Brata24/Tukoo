CREATE TABLE `email_verification_request` (
	`id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`email` varchar(255) NOT NULL,
	`code` varchar(255) NOT NULL,
	`expires_at` int NOT NULL,
	CONSTRAINT `email_verification_request_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `password_reset_session` (
	`id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`email` varchar(255) NOT NULL,
	`code` varchar(255) NOT NULL,
	`expires_at` int NOT NULL,
	`email_verified` int NOT NULL DEFAULT 0,
	`two_factor_verified` int NOT NULL DEFAULT 0,
	CONSTRAINT `password_reset_session_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`expires_at` int NOT NULL,
	`two_factor_verified` int NOT NULL DEFAULT 0,
	CONSTRAINT `session_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`username` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`email_verified` int NOT NULL DEFAULT 0,
	`totp_key` binary,
	`recovery_code` binary NOT NULL,
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `email_verification_request` ADD CONSTRAINT `email_verification_request_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `password_reset_session` ADD CONSTRAINT `password_reset_session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;