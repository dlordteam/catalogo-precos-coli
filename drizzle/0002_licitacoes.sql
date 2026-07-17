CREATE TABLE IF NOT EXISTS `licitacoes` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `numero` text NOT NULL,
  `orgao` text NOT NULL,
  `portal` text DEFAULT 'Licitei' NOT NULL,
  `objeto` text NOT NULL,
  `cidade` text DEFAULT '' NOT NULL,
  `uf` text DEFAULT '' NOT NULL,
  `data_disputa` text DEFAULT '' NOT NULL,
  `status` text DEFAULT 'Em análise' NOT NULL,
  `link_licitei` text DEFAULT '' NOT NULL,
  `observacoes` text DEFAULT '' NOT NULL,
  `criado_em` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `licitacao_items` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `licitacao_id` integer NOT NULL,
  `item_numero` text NOT NULL,
  `descricao_edital` text NOT NULL,
  `quantidade` real DEFAULT 1 NOT NULL,
  `unidade` text DEFAULT 'UN' NOT NULL,
  `produto_codigo` text DEFAULT '' NOT NULL,
  `produto_nome` text NOT NULL,
  `marca` text DEFAULT '' NOT NULL,
  `modelo` text DEFAULT '' NOT NULL,
  `fornecedor` text DEFAULT '' NOT NULL,
  `link_compra` text DEFAULT '' NOT NULL,
  `custo_unitario` real DEFAULT 0 NOT NULL,
  `valor_inicial` real DEFAULT 0 NOT NULL,
  `valor_minimo` real DEFAULT 0 NOT NULL,
  `justificativa` text DEFAULT '' NOT NULL,
  `status_compra` text DEFAULT 'Planejado' NOT NULL,
  `criado_em` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`licitacao_id`) REFERENCES `licitacoes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `licitacao_items_licitacao_idx` ON `licitacao_items` (`licitacao_id`);
