ALTER TABLE `cart_item` DROP FOREIGN KEY `cart_item_table_id_restaurant_table_id_fk`;
--> statement-breakpoint
ALTER TABLE `order` ADD `processing_status` varchar(20) DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE `cart_item` DROP COLUMN `dining_option`;--> statement-breakpoint
ALTER TABLE `cart_item` DROP COLUMN `table_id`;