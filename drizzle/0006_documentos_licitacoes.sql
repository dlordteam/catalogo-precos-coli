CREATE TABLE IF NOT EXISTS `licitacao_documentos` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `licitacao_id` integer NOT NULL,
  `tipo` text DEFAULT 'Outro' NOT NULL,
  `nome` text NOT NULL,
  `arquivo_key` text NOT NULL,
  `content_type` text DEFAULT 'application/octet-stream' NOT NULL,
  `tamanho` integer DEFAULT 0 NOT NULL,
  `criado_em` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`licitacao_id`) REFERENCES `licitacoes`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `licitacao_documentos_licitacao_idx` ON `licitacao_documentos` (`licitacao_id`);
