import { readFileSync, writeFileSync } from "node:fs";

const products = JSON.parse(readFileSync(new URL("../app/products.json", import.meta.url), "utf8"));
const quote = (value) => value == null ? "NULL" : `'${String(value).replaceAll("'", "''")}'`;
const number = (value) => value == null || value === "" ? "NULL" : Number(value);
const rows = products.map((product) => `(${[
  quote(product.fornecedor), quote(product.codigo), quote(product.descricao), quote(product.categoria),
  quote(product.unidade), number(product.pcs_caixa), number(product.preco_unitario), number(product.pagina) || 0,
  quote(product.status_revisao || "Revisar"), quote(product.imagem || ""), quote(product.descricao_detalhada || ""),
  quote(JSON.stringify(product.caracteristicas || [])), quote(product.fonte || ""), quote(product.fonte_nome || ""),
].join(",")})`);

const chunks = [];
for (let index = 0; index < rows.length; index += 20) {
  chunks.push(`INSERT INTO products (fornecedor,codigo,descricao,categoria,unidade,pcs_caixa,preco_unitario,pagina,status_revisao,imagem,descricao_detalhada,caracteristicas,fonte,fonte_nome) VALUES\n${rows.slice(index, index + 20).join(",\n")};`);
}

writeFileSync(new URL("../drizzle/0001_seed_products.sql", import.meta.url), chunks.join("\n--> statement-breakpoint\n"));
console.log(`${products.length} produtos preparados para o banco online.`);
