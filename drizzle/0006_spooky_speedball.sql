ALTER TABLE `user` ADD `fullname` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `phone_number` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `two_factor_enabled` int DEFAULT 0 NOT NULL;