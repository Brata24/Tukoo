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
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cart_item_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `category` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`merchant_id` int NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `category_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `email_verification_request` (
	`id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`email` varchar(255) NOT NULL,
	`code` varchar(255) NOT NULL,
	`expires_at` int NOT NULL,
	CONSTRAINT `email_verification_request_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `merchant` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(63) NOT NULL,
	`address` text NOT NULL,
	`logo` varchar(255) NOT NULL DEFAULT '',
	`primary_color` varchar(7) NOT NULL,
	`secondary_color` varchar(7) NOT NULL,
	`primary_text_color` varchar(7) NOT NULL,
	`secondary_text_color` varchar(7) NOT NULL,
	`slogan` varchar(150) NOT NULL DEFAULT '',
	`user_id` int NOT NULL,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `merchant_id` PRIMARY KEY(`id`),
	CONSTRAINT `merchant_uuid_unique` UNIQUE(`uuid`),
	CONSTRAINT `merchant_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `order` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`order_number` varchar(50) NOT NULL,
	`merchant_id` int NOT NULL,
	`user_pos_id` int,
	`table_id` int,
	`dining_option` varchar(20) NOT NULL,
	`customer_name` varchar(255),
	`customer_phone` varchar(20),
	`subtotal` int NOT NULL,
	`tax` int NOT NULL DEFAULT 0,
	`tip` int NOT NULL DEFAULT 0,
	`total` int NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`processing_status` varchar(20) NOT NULL DEFAULT 'new',
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
CREATE TABLE `payment` (
	`id` int AUTO_INCREMENT NOT NULL,
	`uuid` varchar(36) NOT NULL,
	`order_id` int NOT NULL,
	`payment_method` varchar(20) NOT NULL,
	`amount` int NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'PENDING',
	`payment_request_id` varchar(255),
	`reference_id` varchar(255),
	`channel_code` varchar(50) DEFAULT 'QRIS',
	`qr_string` text,
	`expires_at` timestamp,
	`raw_response` text,
	`paid_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_uuid_unique` UNIQUE(`uuid`)
);
--> statement-breakpoint
CREATE TABLE `product` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`barcode` varchar(255) NOT NULL,
	`price` int NOT NULL,
	`stock` int NOT NULL DEFAULT 0,
	`infinite_stock` int NOT NULL DEFAULT 0,
	`photo` varchar(255) NOT NULL DEFAULT '',
	`category_id` int NOT NULL,
	`merchant_id` int NOT NULL,
	`is_active` int NOT NULL DEFAULT 1,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_barcode_unique` UNIQUE(`barcode`)
);
--> statement-breakpoint
CREATE TABLE `product_variant` (
	`id` int AUTO_INCREMENT NOT NULL,
	`product_id` int NOT NULL,
	`variant_name` varchar(100) NOT NULL,
	`variant_value` varchar(100) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `product_variant_id` PRIMARY KEY(`id`)
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
CREATE TABLE `session` (
	`id` varchar(255) NOT NULL,
	`user_id` int NOT NULL,
	`expires_at` int NOT NULL,
	`two_factor_verified` int NOT NULL DEFAULT 0,
	CONSTRAINT `session_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session_pos` (
	`id` varchar(255) NOT NULL,
	`user_pos_id` int NOT NULL,
	`expires_at` int NOT NULL,
	CONSTRAINT `session_pos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(255) NOT NULL,
	`username` varchar(255) NOT NULL,
	`fullname` varchar(255) NOT NULL,
	`phone_number` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`email_verified` int NOT NULL DEFAULT 0,
	`totp_key` text,
	`two_factor_enabled` int NOT NULL DEFAULT 0,
	`recovery_code` text NOT NULL,
	`profile_picture` varchar(255) NOT NULL DEFAULT '',
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `user_pos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`username` varchar(255) NOT NULL,
	`merchant_id` int NOT NULL,
	`password` varchar(255) NOT NULL,
	`role` varchar(50) NOT NULL DEFAULT 'staff',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_pos_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_pos_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
ALTER TABLE `cart_item` ADD CONSTRAINT `cart_item_user_pos_id_user_pos_id_fk` FOREIGN KEY (`user_pos_id`) REFERENCES `user_pos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cart_item` ADD CONSTRAINT `cart_item_merchant_id_merchant_id_fk` FOREIGN KEY (`merchant_id`) REFERENCES `merchant`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cart_item` ADD CONSTRAINT `cart_item_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cart_item` ADD CONSTRAINT `cart_item_variant_id_product_variant_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `product_variant`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `category` ADD CONSTRAINT `category_merchant_id_merchant_id_fk` FOREIGN KEY (`merchant_id`) REFERENCES `merchant`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `email_verification_request` ADD CONSTRAINT `email_verification_request_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `merchant` ADD CONSTRAINT `merchant_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order` ADD CONSTRAINT `order_merchant_id_merchant_id_fk` FOREIGN KEY (`merchant_id`) REFERENCES `merchant`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order` ADD CONSTRAINT `order_user_pos_id_user_pos_id_fk` FOREIGN KEY (`user_pos_id`) REFERENCES `user_pos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order` ADD CONSTRAINT `order_table_id_restaurant_table_id_fk` FOREIGN KEY (`table_id`) REFERENCES `restaurant_table`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_item` ADD CONSTRAINT `order_item_order_id_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_item` ADD CONSTRAINT `order_item_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_item` ADD CONSTRAINT `order_item_variant_id_product_variant_id_fk` FOREIGN KEY (`variant_id`) REFERENCES `product_variant`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `password_reset_session` ADD CONSTRAINT `password_reset_session_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment` ADD CONSTRAINT `payment_order_id_order_id_fk` FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product` ADD CONSTRAINT `product_category_id_category_id_fk` FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product` ADD CONSTRAINT `product_merchant_id_merchant_id_fk` FOREIGN KEY (`merchant_id`) REFERENCES `merchant`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_variant` ADD CONSTRAINT `product_variant_product_id_product_id_fk` FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `restaurant_table` ADD CONSTRAINT `restaurant_table_merchant_id_merchant_id_fk` FOREIGN KEY (`merchant_id`) REFERENCES `merchant`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session_pos` ADD CONSTRAINT `session_pos_user_pos_id_user_pos_id_fk` FOREIGN KEY (`user_pos_id`) REFERENCES `user_pos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_pos` ADD CONSTRAINT `user_pos_merchant_id_merchant_id_fk` FOREIGN KEY (`merchant_id`) REFERENCES `merchant`(`id`) ON DELETE no action ON UPDATE no action;