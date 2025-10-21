ALTER TABLE `payment` MODIFY COLUMN `status` varchar(20) NOT NULL DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE `order` ADD `customer_name` varchar(255);--> statement-breakpoint
ALTER TABLE `order` ADD `customer_phone` varchar(20);--> statement-breakpoint
ALTER TABLE `order` ADD `tip` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `payment` ADD `payment_request_id` varchar(255);--> statement-breakpoint
ALTER TABLE `payment` ADD `reference_id` varchar(255);--> statement-breakpoint
ALTER TABLE `payment` ADD `channel_code` varchar(50) DEFAULT 'QRIS';--> statement-breakpoint
ALTER TABLE `payment` ADD `qr_string` text;--> statement-breakpoint
ALTER TABLE `payment` ADD `expires_at` timestamp;--> statement-breakpoint
ALTER TABLE `payment` ADD `raw_response` text;--> statement-breakpoint
ALTER TABLE `payment` DROP COLUMN `xendit_invoice_id`;--> statement-breakpoint
ALTER TABLE `payment` DROP COLUMN `xendit_invoice_url`;--> statement-breakpoint
ALTER TABLE `payment` DROP COLUMN `xendit_payment_channel`;