ALTER TABLE `user` MODIFY COLUMN `totp_key` text;--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `recovery_code` text NOT NULL;