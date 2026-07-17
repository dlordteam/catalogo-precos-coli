CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fornecedor` text NOT NULL,
	`codigo` text NOT NULL,
	`descricao` text NOT NULL,
	`categoria` text NOT NULL,
	`unidade` text NOT NULL,
	`pcs_caixa` integer,
	`preco_unitario` real,
	`pagina` integer DEFAULT 0 NOT NULL,
	`status_revisao` text DEFAULT 'Revisar' NOT NULL,
	`imagem` text DEFAULT '' NOT NULL,
	`descricao_detalhada` text DEFAULT '' NOT NULL,
	`caracteristicas` text DEFAULT '[]' NOT NULL,
	`fonte` text DEFAULT '' NOT NULL,
	`fonte_nome` text DEFAULT '' NOT NULL,
	`atualizado_em` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `products_codigo_idx` ON `products` (`codigo`);--> statement-breakpoint
CREATE INDEX `products_categoria_idx` ON `products` (`categoria`);--> statement-breakpoint
CREATE INDEX `products_preco_idx` ON `products` (`preco_unitario`);