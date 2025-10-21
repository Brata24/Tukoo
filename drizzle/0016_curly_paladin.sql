-- Add barcode column as nullable first
ALTER TABLE `product` ADD COLUMN `barcode` varchar(255);

-- Update existing products with UUID barcodes
UPDATE `product` SET `barcode` = UUID() WHERE `barcode` IS NULL;

-- Now make the column NOT NULL and add unique constraint
ALTER TABLE `product` MODIFY COLUMN `barcode` varchar(255) NOT NULL;
ALTER TABLE `product` ADD CONSTRAINT `product_barcode_unique` UNIQUE(`barcode`);