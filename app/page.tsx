"use client";

import { useMemo, useState } from "react";
import productsData from "./products.json";

type Product = {
  fornecedor: string;
  codigo: string;
  descricao: string;
  categoria: string;
  unidade: string;
  pcs_caixa: number | null;
  preco_unitario: number | null;
  pagina: number;
  codigo_catalogo: boolean;
  status_revisao: string;
  imagem: string;
};

const products = productsData as Product[];
const PAGE_SIZE = 30;
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function Home() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("todos");
  const [page, setPage] = useState(1);
  const [markup, setMarkup] = useState(60);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("pt-BR");
    return products.filter((product) => {
      const matchesQuery = !needle || `${product.codigo} ${product.descricao}`.toLocaleLowerCase("pt-BR").includes(needle);
      const matchesStatus = status === "todos" || (status === "revisar" ? product.status_revisao === "Revisar" : product.status_revisao !== "Revisar");
      return matchesQuery && matchesStatus;
    });
  }, [query, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  return (
    <main>
      <header className="topbar">
        <div className="brand">
          <span className="brandMark">COLI</span>
          <div>
            <strong>Catálogo de preços</strong>
            <small>Base de fornecedores para licitações</small>
          </div>
        </div>
        <div className="catalogMeta"><span>Fornecedor</span><strong>Lehmox</strong></div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">CATÁLOGO VISUAL · 15 JUL 2026</p>
          <h1>Encontre o produto certo<br />em poucos segundos.</h1>
          <p className="subtitle">Pesquise por nome ou código e veja o custo, a embalagem e o preço sugerido para licitação.</p>
        </div>
        <div className="heroStat">
          <span>Produtos cadastrados</span>
          <strong>{products.length}</strong>
          <small>{products.filter((p) => p.status_revisao !== "Revisar").length} prontos para consulta</small>
        </div>
      </section>

      <section className="controls" aria-label="Filtros do catálogo">
        <label className="searchBox">
          <span>Buscar produto</span>
          <input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Ex.: mouse, suporte TV ou LEY-1504" />
        </label>
        <label>
          <span>Situação</span>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="todos">Todos os produtos</option>
            <option value="prontos">Prontos para consulta</option>
            <option value="revisar">Precisam de revisão</option>
          </select>
        </label>
        <label>
          <span>Acréscimo</span>
          <div className="markupInput"><input type="number" min="0" max="500" value={markup} onChange={(event) => setMarkup(Number(event.target.value))} /><b>%</b></div>
        </label>
      </section>

      <section className="resultsBar">
        <p><strong>{filtered.length}</strong> produtos encontrados</p>
        <p>Preço sugerido = custo + {markup}%</p>
      </section>

      {visible.length ? (
        <section className="grid" aria-live="polite">
          {visible.map((product) => {
            const suggested = product.preco_unitario == null ? null : product.preco_unitario * (1 + markup / 100);
            return (
              <article className="card" key={`${product.pagina}-${product.codigo}`}>
                <div className="imageWrap">
                  <img src={product.imagem} alt={product.descricao || `Produto ${product.codigo}`} loading="lazy" />
                  {product.status_revisao === "Revisar" && <span className="reviewBadge">Revisar</span>}
                </div>
                <div className="cardBody">
                  <div className="codeRow"><span>{product.codigo}</span><small>Pág. {product.pagina}</small></div>
                  <h2>{product.descricao || "Descrição não identificada"}</h2>
                  <div className="details"><span>Unidade: {product.unidade}</span><span>Caixa: {product.pcs_caixa ?? "—"}</span></div>
                  <div className="prices">
                    <div><small>Custo</small><strong>{product.preco_unitario == null ? "A revisar" : money.format(product.preco_unitario)}</strong></div>
                    <div className="suggested"><small>Preço sugerido</small><strong>{suggested == null ? "—" : money.format(suggested)}</strong></div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : <div className="empty"><strong>Nenhum produto encontrado.</strong><span>Tente buscar por outra palavra ou código.</span></div>}

      <nav className="pagination" aria-label="Paginação">
        <button disabled={safePage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</button>
        <span>Página <strong>{safePage}</strong> de {pageCount}</span>
        <button disabled={safePage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Próxima</button>
      </nav>

      <footer>COLI Distribuidora · Base de apoio para pesquisa de preços · Confirme disponibilidade e condições antes de enviar propostas.</footer>
    </main>
  );
}
