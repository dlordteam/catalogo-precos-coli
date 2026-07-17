ALTER TABLE `licitacao_items` ADD COLUMN `produto_id` integer;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `licitacao_items_produto_idx` ON `licitacao_items` (`produto_id`);
--> statement-breakpoint
UPDATE `licitacoes` SET `status` = 'Proposta Enviada' WHERE `status` IN ('Em análise', 'Em disputa', 'Participando', 'Recebendo proposta');
--> statement-breakpoint
UPDATE `licitacoes` SET `status` = 'Ganha' WHERE `status` = 'Vencida';
--> statement-breakpoint
UPDATE `licitacoes` SET `status` = 'Paga' WHERE `status` = 'Concluída';
