ALTER TABLE `merchant` ADD `uuid` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `merchant` ADD CONSTRAINT `merchant_uuid_unique` UNIQUE(`uuid`);