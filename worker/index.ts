/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  DOCS: R2Bucket;
  AUTH_USERNAME?: string;
  AUTH_PASSWORD?: string;
  AUTH_SECRET?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

type ProductRow = {
  id: number;
  fornecedor: string;
  codigo: string;
  descricao: string;
  categoria: string;
  unidade: string;
  pcs_caixa: number | null;
  preco_unitario: number | null;
  pagina: number;
  status_revisao: string;
  imagem: string;
  descricao_detalhada: string;
  caracteristicas: string;
  fonte: string;
  fonte_nome: string;
};

const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, "0")).join("");
async function signature(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}
async function authenticated(request: Request, env: Env) {
  if (!env.AUTH_USERNAME || !env.AUTH_PASSWORD || !env.AUTH_SECRET) return false;
  const match = request.headers.get("Cookie")?.match(/(?:^|;\s*)coli_session=([^;]+)/);
  if (!match) return false;
  const [username, expires, sent] = decodeURIComponent(match[1]).split(".");
  if (!username || !expires || !sent || Number(expires) < Date.now()) return false;
  return username === env.AUTH_USERNAME && sent === await signature(`${username}.${expires}`, env.AUTH_SECRET);
}
const loginPage = (error = "") => new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Acesso privado | COLI</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 20% 20%,#123457,#041326 55%);font-family:Arial,sans-serif;color:#10243b}.box{width:min(430px,92vw);background:#fff;border-radius:24px;padding:38px;box-shadow:0 24px 70px #0008}.brand{display:flex;gap:14px;align-items:center;margin-bottom:28px}.mark{display:grid;place-items:center;width:52px;height:52px;border-radius:15px;background:#08284a;color:white;font-size:26px;font-weight:800}.brand strong{display:block;font-size:20px}.brand span{color:#65758a;font-size:13px}h1{font-size:28px;margin:0 0 8px}p{color:#65758a;line-height:1.5;margin:0 0 24px}label{display:block;font-size:13px;font-weight:700;margin:16px 0 7px}input{width:100%;padding:14px;border:1px solid #cdd7e3;border-radius:11px;font-size:16px}button{width:100%;margin-top:22px;padding:15px;border:0;border-radius:11px;background:#0a3159;color:white;font-size:16px;font-weight:800;cursor:pointer}.error{padding:11px;border-radius:9px;background:#fff0f0;color:#b42318;font-size:13px;margin-bottom:14px}</style></head><body><form class="box" method="post" action="/login"><div class="brand"><div class="mark">C</div><div><strong>COLI Distribuidora</strong><span>Área comercial privada</span></div></div><h1>Entrar no sistema</h1><p>Acesse o catálogo de preços e a gestão de licitações.</p>${error ? `<div class="error">${error}</div>` : ""}<label>Usuário</label><input name="username" autocomplete="username" required autofocus><label>Senha</label><input name="password" type="password" autocomplete="current-password" required><input type="hidden" name="returnTo" value="/"><button type="submit">Entrar com segurança</button></form></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });

async function handleLogin(request: Request, env: Env) {
  if (request.method === "GET") return loginPage();
  const form = await request.formData();
  const username = String(form.get("username") || "");
  const password = String(form.get("password") || "");
  if (username !== env.AUTH_USERNAME || password !== env.AUTH_PASSWORD || !env.AUTH_SECRET) return loginPage("Usuário ou senha incorretos.");
  const expires = Date.now() + 1000 * 60 * 60 * 24 * 30;
  const value = `${username}.${expires}`;
  const token = `${value}.${await signature(value, env.AUTH_SECRET)}`;
  return new Response(null, { status: 302, headers: { Location: "/", "Set-Cookie": `coli_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000` } });
}

async function licitacoesApi(request: Request, env: Env, url: URL) {
  if (request.method === "GET") {
    const licitacoes = (await env.DB.prepare("SELECT * FROM licitacoes ORDER BY id DESC").all()).results || [];
    const items = (await env.DB.prepare("SELECT i.*, p.descricao AS catalogo_nome, p.descricao_detalhada AS catalogo_descricao, p.imagem AS catalogo_imagem, p.categoria AS catalogo_categoria, p.status_revisao AS catalogo_status, p.fonte AS catalogo_fonte FROM licitacao_items i LEFT JOIN products p ON p.id = i.produto_id ORDER BY i.id").all()).results || [];
    const documentos = (await env.DB.prepare("SELECT id,licitacao_id,tipo,nome,content_type,tamanho,criado_em FROM licitacao_documentos ORDER BY id DESC").all()).results || [];
    return Response.json({ licitacoes: licitacoes.map((lic: any) => ({ ...lic, items: items.filter((item: any) => item.licitacao_id === lic.id), documents: documentos.filter((doc: any) => doc.licitacao_id === lic.id) })) }, { headers: { "Cache-Control": "no-store" } });
  }
  const documentMatch = url.pathname.match(/^\/api\/licitacoes\/(\d+)\/documentos$/);
  if (request.method === "POST" && documentMatch) {
    const form = await request.formData();
    const file = form.get("arquivo");
    if (!(file instanceof File) || file.size === 0) return Response.json({ error: "Arquivo obrigatório" }, { status: 400 });
    const licitacaoId = Number(documentMatch[1]);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
    const key = `${licitacaoId}/${crypto.randomUUID()}-${safeName}`;
    await env.DOCS.put(key, file.stream(), { httpMetadata: { contentType: file.type || "application/octet-stream" } });
    const row = await env.DB.prepare("INSERT INTO licitacao_documentos (licitacao_id,tipo,nome,arquivo_key,content_type,tamanho) VALUES (?,?,?,?,?,?) RETURNING id,licitacao_id,tipo,nome,content_type,tamanho,criado_em")
      .bind(licitacaoId, String(form.get("tipo") || "Outro"), file.name, key, file.type || "application/octet-stream", file.size).first();
    return Response.json({ document: row }, { status: 201 });
  }
  const deleteMatch = url.pathname.match(/^\/api\/licitacoes\/(\d+)$/);
  if (request.method === "DELETE" && deleteMatch) {
    const id = Number(deleteMatch[1]);
    await env.DB.batch([
      env.DB.prepare("DELETE FROM licitacao_items WHERE licitacao_id = ?").bind(id),
      env.DB.prepare("DELETE FROM licitacoes WHERE id = ?").bind(id),
    ]);
    return Response.json({ ok: true });
  }
  const body = await request.json<Record<string, any>>();
  const licitacaoMatch = url.pathname.match(/^\/api\/licitacoes\/(\d+)$/);
  if (request.method === "PATCH" && licitacaoMatch) {
    await env.DB.prepare("UPDATE licitacoes SET numero=?,orgao=?,portal=?,objeto=?,cidade=?,uf=?,data_disputa=?,status=?,link_licitei=?,observacoes=?,processo=?,modalidade=?,uasg=?,edital_url=?,empenho_numero=?,empenho_data=?,empenho_valor=?,valor_recebido=?,data_recebimento=?,data_compra=?,data_envio=?,codigo_rastreio=? WHERE id=?")
      .bind(body.numero, body.orgao, body.portal || "Licitei", body.objeto, body.cidade || "", body.uf || "", body.data_disputa || "", body.status || "Proposta Enviada", body.link_licitei || "", body.observacoes || "", body.processo || "", body.modalidade || "Pregão eletrônico", body.uasg || "", body.edital_url || "", body.empenho_numero || "", body.empenho_data || "", Number(body.empenho_valor) || 0, Number(body.valor_recebido) || 0, body.data_recebimento || "", body.data_compra || "", body.data_envio || "", body.codigo_rastreio || "", Number(licitacaoMatch[1])).run();
    return Response.json({ ok: true });
  }
  if (request.method === "POST" && url.pathname === "/api/licitacoes") {
    const result = await env.DB.prepare("INSERT INTO licitacoes (numero,orgao,portal,objeto,cidade,uf,data_disputa,status,link_licitei,observacoes,processo,modalidade,uasg,edital_url) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id")
      .bind(body.numero, body.orgao, body.portal || "Licitei", body.objeto, body.cidade || "", body.uf || "", body.data_disputa || "", body.status || "Proposta Enviada", body.link_licitei || "", body.observacoes || "", body.processo || "", body.modalidade || "Pregão eletrônico", body.uasg || "", body.edital_url || "").first();
    return Response.json(result, { status: 201 });
  }
  const itemMatch = url.pathname.match(/^\/api\/licitacoes\/(\d+)\/items$/);
  if (request.method === "POST" && itemMatch) {
    const custo = Number(body.custo_unitario) || 0;
    const minimo = Number(body.valor_minimo) || custo * 1.6;
    const result = await env.DB.prepare("INSERT INTO licitacao_items (licitacao_id,item_numero,descricao_edital,quantidade,unidade,produto_id,produto_codigo,produto_nome,marca,modelo,fornecedor,link_compra,custo_unitario,valor_inicial,valor_minimo,valor_vendido,justificativa,status_compra) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id")
      .bind(Number(itemMatch[1]), body.item_numero, body.descricao_edital, Number(body.quantidade) || 1, body.unidade || "UN", Number(body.produto_id) || null, body.produto_codigo || "", body.produto_nome, body.marca || "", body.modelo || "", body.fornecedor || "", body.link_compra || "", custo, Number(body.valor_inicial) || 0, minimo, Number(body.valor_vendido) || 0, body.justificativa || "", body.status_compra || "Planejado").first();
    return Response.json(result, { status: 201 });
  }
  const updateItemMatch = url.pathname.match(/^\/api\/licitacoes\/(\d+)\/items\/(\d+)$/);
  if (request.method === "PATCH" && updateItemMatch) {
    await env.DB.prepare("UPDATE licitacao_items SET status_compra=COALESCE(?,status_compra), valor_vendido=COALESCE(?,valor_vendido) WHERE id=? AND licitacao_id=?")
      .bind(body.status_compra ?? null, body.valor_vendido == null ? null : Number(body.valor_vendido), Number(updateItemMatch[2]), Number(updateItemMatch[1])).run();
    return Response.json({ ok: true });
  }
  return Response.json({ error: "Operação não encontrada" }, { status: 404 });
}

async function productsApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (request.method === "POST") {
    const body = await request.json<Record<string, any>>();
    const characteristics = Array.isArray(body.caracteristicas) ? body.caracteristicas : String(body.caracteristicas || "").split("\n").map((item) => item.trim()).filter(Boolean);
    const row = await env.DB.prepare("INSERT INTO products (fornecedor,codigo,descricao,categoria,unidade,pcs_caixa,preco_unitario,pagina,status_revisao,imagem,descricao_detalhada,caracteristicas,fonte,fonte_nome) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) RETURNING id,fornecedor,codigo,descricao,categoria,unidade,pcs_caixa,preco_unitario,pagina,status_revisao,imagem,descricao_detalhada,caracteristicas,fonte,fonte_nome")
      .bind(body.fornecedor, body.codigo, body.descricao, body.categoria, body.unidade || "UN", body.pcs_caixa ? Number(body.pcs_caixa) : null, body.preco_unitario === "" || body.preco_unitario == null ? null : Number(body.preco_unitario), 0, body.status_revisao || "Revisar", body.imagem || "", body.descricao_detalhada || "", JSON.stringify(characteristics), body.fonte || "", body.fonte_nome || body.fornecedor).first<ProductRow>();
    return Response.json({ product: { ...row, caracteristicas: characteristics } }, { status: 201 });
  }
  const query = (url.searchParams.get("q") || "").trim();
  const category = (url.searchParams.get("categoria") || "").trim();
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 5000, 1), 5000);
  const conditions: string[] = [];
  const values: Array<string | number> = [];

  if (query) {
    conditions.push("(descricao LIKE ? OR codigo LIKE ? OR fornecedor LIKE ? OR categoria LIKE ? OR descricao_detalhada LIKE ?)");
    const like = `%${query}%`;
    values.push(like, like, like, like, like);
  }
  if (category) {
    conditions.push("categoria = ?");
    values.push(category);
  }

  const where = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
  const statement = env.DB.prepare(`SELECT id, fornecedor, codigo, descricao, categoria, unidade, pcs_caixa, preco_unitario, pagina, status_revisao, imagem, descricao_detalhada, caracteristicas, fonte, fonte_nome FROM products${where} ORDER BY id LIMIT ?`).bind(...values, limit);
  const result = await statement.all<ProductRow>();
  const products = (result.results || []).map((row) => ({
    ...row,
    caracteristicas: (() => { try { return JSON.parse(row.caracteristicas || "[]"); } catch { return []; } })(),
  }));

  return Response.json({ products, total: products.length }, {
    headers: { "Cache-Control": "public, max-age=60" },
  });
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/login") return handleLogin(request, env);
    if (url.pathname === "/logout") return new Response(null, { status: 302, headers: { Location: "/login", "Set-Cookie": "coli_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0" } });
    if (!(await authenticated(request, env))) {
      if (url.pathname.startsWith("/api/")) return Response.json({ error: "Não autorizado" }, { status: 401 });
      return new Response(null, { status: 302, headers: { Location: "/login" } });
    }

    const documentRoute = url.pathname.match(/^\/api\/documentos\/(\d+)$/);
    if (documentRoute && request.method === "GET") {
      const document = await env.DB.prepare("SELECT nome,arquivo_key,content_type FROM licitacao_documentos WHERE id=?").bind(Number(documentRoute[1])).first<any>();
      if (!document) return new Response("Documento não encontrado", { status: 404 });
      const object = await env.DOCS.get(document.arquivo_key);
      if (!object) return new Response("Arquivo não encontrado", { status: 404 });
      const name = String(document.nome).replace(/["\r\n]/g, "");
      return new Response(object.body, { headers: { "Content-Type": document.content_type || "application/octet-stream", "Content-Disposition": `inline; filename="${name}"`, "Cache-Control": "private, max-age=300" } });
    }
    if (documentRoute && request.method === "DELETE") {
      const document = await env.DB.prepare("SELECT arquivo_key FROM licitacao_documentos WHERE id=?").bind(Number(documentRoute[1])).first<any>();
      if (document) await env.DOCS.delete(document.arquivo_key);
      await env.DB.prepare("DELETE FROM licitacao_documentos WHERE id=?").bind(Number(documentRoute[1])).run();
      return Response.json({ ok: true });
    }

    if (url.pathname === "/api/licitacoes" || url.pathname.match(/^\/api\/licitacoes\/\d+(?:\/items(?:\/\d+)?|\/documentos)?$/)) {
      return licitacoesApi(request, env, url);
    }

    if (url.pathname === "/api/products" && (request.method === "GET" || request.method === "POST")) {
      return productsApi(request, env);
    }
    const deleteProduct = url.pathname.match(/^\/api\/products\/(\d+)$/);
    if (deleteProduct && request.method === "DELETE") {
      await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(Number(deleteProduct[1])).run();
      return Response.json({ ok: true });
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
