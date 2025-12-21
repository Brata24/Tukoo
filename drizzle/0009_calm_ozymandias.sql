ALTER TABLE `category` DROP FOREIGN KEY `category_merchant_id_merchant_id_fk`;
--> statement-breakpoint
ALTER TABLE `order` DROP FOREIGN KEY `order_merchant_id_merchant_id_fk`;
--> statement-breakpoint
ALTER TABLE `product` DROP FOREIGN KEY `product_merchant_id_merchant_id_fk`;
--> statement-breakpoint
ALTER TABLE `promo_banner` DROP FOREIGN KEY `promo_banner_merchant_id_merchant_id_fk`;
--> statement-breakpoint
ALTER TABLE `restaurant_table` DROP FOREIGN KEY `restaurant_table_merchant_id_merchant_id_fk`;
--> statement-breakpoint
ALTER TABLE `user_pos` DROP FOREIGN KEY `user_pos_merchant_id_merchant_id_fk`;
--> statement-breakpoint
ALTER TABLE `category` ADD CONSTRAINT `category_merchant_id_merchant_id_fk` FOREIGN KEY (`merchant_id`) REFERENCES `merchant`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order` ADD CONSTRAINT `order_merchant_id_merchant_id_fk` FOREIGN KEY (`merchant_id`) REFERENCES `merchant`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product` ADD CONSTRAINT `product_merchant_id_merchant_id_fk` FOREIGN KEY (`merchant_id`) REFERENCES `merchant`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `promo_banner` ADD CONSTRAINT `promo_banner_merchant_id_merchant_id_fk` FOREIGN KEY (`merchant_id`) REFERENCES `merchant`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `restaurant_table` ADD CONSTRAINT `restaurant_table_merchant_id_merchant_id_fk` FOREIGN KEY (`merchant_id`) REFERENCES `merchant`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_pos` ADD CONSTRAINT `user_pos_merchant_id_merchant_id_fk` FOREIGN KEY (`merchant_id`) REFERENCES `merchant`(`id`) ON DELETE cascade ON UPDATE no action;