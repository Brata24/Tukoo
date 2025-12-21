ALTER TABLE `cart_item` DROP FOREIGN KEY `cart_item_user_pos_id_user_pos_id_fk`;
--> statement-breakpoint
ALTER TABLE `cart_item` DROP FOREIGN KEY `cart_item_merchant_id_merchant_id_fk`;
--> statement-breakpoint
ALTER TABLE `cart_item` ADD CONSTRAINT `cart_item_user_pos_id_user_pos_id_fk` FOREIGN KEY (`user_pos_id`) REFERENCES `user_pos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cart_item` ADD CONSTRAINT `cart_item_merchant_id_merchant_id_fk` FOREIGN KEY (`merchant_id`) REFERENCES `merchant`(`id`) ON DELETE cascade ON UPDATE no action;