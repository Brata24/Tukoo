CREATE TABLE `order` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`order_number` varchar(50) NOT NULL,
	`merchant_id` int NOT NULL,
	`user_pos_id` int,
	`table_id` int,
	`dining_option` varchar(20) NOT NULL,
	`subtotal` int NOT NULL,
	`tax` int NOT NULL DEFAULT 0,
	`total` int NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`payment_method` varchar(20),
	`payment_status` varchar(20) NOT NULL DEFAULT 'unpaid',
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `order_id` PRIMARY KEY(`id`),
	CONSTRAINT `order_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `order_order_number_unique` UNIQUE(`order_number`)
);
--> statement-breakpoint
CREATE TABLE `order_item` (
	`id` int AUTO_INCREMENT NOT NULL,
	`order_id` int NOT NULL,
	`product_id` int NOT NULL,
	`product_name` varchar(255) NOT NULL,
	`variant_id` int,
	`variant_name` varchar(100),
	`variant_value` varchar(100),
	`quantity` int NOT NULL,
	`unit_price` int NOT NULL,
	`subtotal` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_item_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`order_id` int NOT NULL,
	`payment_method` varchar(20) NOT NULL,
	`amount` int NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`xendit_invoice_id` varchar(255),
	`xendit_invoice_url` varchar(500),
	`xendit_payment_channel` varchar(50),
	`paid_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `restaurant_table` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`capacity` int NOT NULL DEFAULT 4,
	`qr_token` varchar(36) NOT NULL,
	`is_active` int NOT NULL DEFAULT 1,
	`allow_pay_at_cashier` int NOT NULL DEFAULT 1,
	`merchant_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `restaurant_table_id` PRIMARY KEY(`id`),
	CONSTRAINT `restaurant_table_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `restaurant_table_qr_token_unique` UNIQUE(`qr_token`)
);
--> statement-breakpoint
ALTER TABLE `order` ADD CONSTRAINT `order_merchant_id_merchant_id_fk` FOREIGN KEY (`merchant_id`) REFERENCES `merchant`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order` ADD CONSTRAINT `order_user_pos_id_user_pos_id_fk` FOREIGN KEY (`user_pos_id`) REFERENCES `user_pos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order` ADD CONSTRAINT `order_table_id_restaurant_table_id_fk` FOREIGN KEY (`table_id`) REFERENCES `restaurant_table`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_item` ADD CONSTRAINT `order_item_order_id_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_item` ADD CONSTRAINT `order_item_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_item` ADD CONSTRAINT `order_item_variant_id_product_variant_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `product_variant`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment` ADD CONSTRAINT `payment_order_id_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `restaurant_table` ADD CONSTRAINT `restaurant_table_merchant_id_merchant_id_fk` FOREIGN KEY (`merchant_id`) REFERENCES `merchant`(`id`) ON DELETE no action ON UPDATE no action;