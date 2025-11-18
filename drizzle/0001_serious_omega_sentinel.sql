RENAME TABLE `users` TO `user`;--> statement-breakpoint
ALTER TABLE `user` DROP INDEX `users_email_unique`;--> statement-breakpoint
ALTER TABLE `email_verification_request` DROP FOREIGN KEY `email_verification_request_user_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `merchant` DROP FOREIGN KEY `merchant_user_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `password_reset_session` DROP FOREIGN KEY `password_reset_session_user_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `session` DROP FOREIGN KEY `session_user_id_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `user` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `user` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `payment` ADD `payment_number` varchar(255);--> statement-breakpoint
ALTER TABLE `user` ADD CONSTRAINT `user_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `email_verification_request` ADD CONSTRAINT `email_verification_request_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `merchant` ADD CONSTRAINT `merchant_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `password_reset_session` ADD CONSTRAINT `password_reset_session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;