ALTER TABLE `apiKeys` DROP INDEX `apiKeys_userId_unique`;--> statement-breakpoint
ALTER TABLE `apiKeys` MODIFY COLUMN `provider` enum('openai','anthropic','binance') NOT NULL;--> statement-breakpoint
ALTER TABLE `apiKeys` ADD `apiSecret` text;