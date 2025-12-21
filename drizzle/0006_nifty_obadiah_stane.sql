ALTER TABLE `cart_item` DROP FOREIGN KEY `cart_item_product_id_product_id_fk`;
--> statement-breakpoint
ALTER TABLE `cart_item` DROP FOREIGN KEY `cart_item_variant_id_product_variant_id_fk`;
--> statement-breakpoint
ALTER TABLE `order_item` DROP FOREIGN KEY `order_item_product_id_product_id_fk`;
--> statement-breakpoint
ALTER TABLE `order_item` DROP FOREIGN KEY `order_item_variant_id_product_variant_id_fk`;
--> statement-breakpoint
ALTER TABLE `cart_item` MODIFY COLUMN `product_id` int;--> statement-breakpoint
ALTER TABLE `order_item` MODIFY COLUMN `product_id` int;