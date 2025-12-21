-- Drop the foreign key constraint that prevents product deletion
ALTER TABLE `order_item` DROP FOREIGN KEY `order_item_product_id_product_id_fk`;

-- Make product_id nullable in order_item (for historical records)
ALTER TABLE `order_item` MODIFY `product_id` int NULL;

-- Make variant_id nullable in order_item (already nullable, but ensure consistency)
ALTER TABLE `order_item` DROP FOREIGN KEY `order_item_variant_id_product_variant_id_fk`;
ALTER TABLE `order_item` MODIFY `variant_id` int NULL;

-- Similarly for cart_item
ALTER TABLE `cart_item` DROP FOREIGN KEY `cart_item_product_id_product_id_fk`;
ALTER TABLE `cart_item` DROP FOREIGN KEY `cart_item_variant_id_product_variant_id_fk`;