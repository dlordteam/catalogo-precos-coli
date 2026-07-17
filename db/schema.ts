import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fornecedor: text("fornecedor").notNull(),
  codigo: text("codigo").notNull(),
  descricao: text("descricao").notNull(),
  categoria: text("categoria").notNull(),
  unidade: text("unidade").notNull(),
  pcsCaixa: integer("pcs_caixa"),
  precoUnitario: real("preco_unitario"),
  pagina: integer("pagina").notNull().default(0),
  statusRevisao: text("status_revisao").notNull().default("Revisar"),
  imagem: text("imagem").notNull().default(""),
  descricaoDetalhada: text("descricao_detalhada").notNull().default(""),
  caracteristicas: text("caracteristicas").notNull().default("[]"),
  fonte: text("fonte").notNull().default(""),
  fonteNome: text("fonte_nome").notNull().default(""),
  atualizadoEm: text("atualizado_em").notNull().default("CURRENT_TIMESTAMP"),
}, (table) => [
  index("products_codigo_idx").on(table.codigo),
  index("products_categoria_idx").on(table.categoria),
  index("products_preco_idx").on(table.precoUnitario),
]);
