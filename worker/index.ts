/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
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

async function productsApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
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
  const statement = env.DB.prepare(`SELECT fornecedor, codigo, descricao, categoria, unidade, pcs_caixa, preco_unitario, pagina, status_revisao, imagem, descricao_detalhada, caracteristicas, fonte, fonte_nome FROM products${where} ORDER BY id LIMIT ?`).bind(...values, limit);
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

    if (url.pathname === "/api/products" && request.method === "GET") {
      return productsApi(request, env);
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
