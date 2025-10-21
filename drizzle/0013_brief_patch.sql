CREATE TABLE `session_pos` (
	`id` varchar(255) NOT NULL,
	`user_pos_id` int NOT NULL,
	`expires_at` int NOT NULL,
	CONSTRAINT `session_pos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `session_pos` ADD CONSTRAINT `session_pos_user_pos_id_user_pos_id_fk` FOREIGN KEY (`user_pos_id`) REFERENCES `user_pos`(`id`) ON DELETE no action ON UPDATE no action;