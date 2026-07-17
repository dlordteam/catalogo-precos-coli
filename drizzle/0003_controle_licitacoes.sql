ALTER TABLE `licitacoes` ADD COLUMN `processo` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `licitacoes` ADD COLUMN `modalidade` text DEFAULT 'Pregão eletrônico' NOT NULL;
--> statement-breakpoint
ALTER TABLE `licitacoes` ADD COLUMN `uasg` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `licitacoes` ADD COLUMN `edital_url` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `licitacoes` ADD COLUMN `empenho_numero` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `licitacoes` ADD COLUMN `empenho_data` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `licitacoes` ADD COLUMN `empenho_valor` real DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `licitacoes` ADD COLUMN `valor_recebido` real DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `licitacoes` ADD COLUMN `data_recebimento` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `licitacoes` ADD COLUMN `data_compra` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `licitacoes` ADD COLUMN `data_envio` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `licitacoes` ADD COLUMN `codigo_rastreio` text DEFAULT '' NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `licitacoes_status_idx` ON `licitacoes` (`status`);
