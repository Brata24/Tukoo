CREATE TABLE `cart_item` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_pos_id` int NOT NULL,
	`merchant_id` int NOT NULL,
	`product_id` int NOT NULL,
	`product_name` varchar(255) NOT NULL,
	`variant_id` int,
	`variant_name` varchar(100),
	`variant_value` varchar(100),
	`unit_price` int NOT NULL,
	`quantity` int NOT NULL,
	`subtotal` int NOT NULL,
	`dining_option` varchar(20) NOT NULL DEFAULT 'pickup',
	`table_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cart_item_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cart_item` ADD CONSTRAINT `cart_item_user_pos_id_user_pos_id_fk` FOREIGN KEY (`user_pos_id`) REFERENCES `user_pos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cart_item` ADD CONSTRAINT `cart_item_merchant_id_merchant_id_fk` FOREIGN KEY (`merchant_id`) REFERENCES `merchant`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cart_item` ADD CONSTRAINT `cart_item_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cart_item` ADD CONSTRAINT `cart_item_variant_id_product_variant_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `product_variant`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cart_item` ADD CONSTRAINT `cart_item_table_id_restaurant_table_id_fk` FOREIGN KEY (`table_id`) REFERENCES `restaurant_table`(`id`) ON DELETE no action ON UPDATE no action;