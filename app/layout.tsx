import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Catálogo de Preços | COLI Distribuidora",
  description: "Catálogo visual pesquisável de fornecedores e preços para licitações.",
  openGraph: {
    title: "Catálogo de Preços | COLI Distribuidora",
    description: "Consulte produtos, imagens, custos e preços sugeridos para licitações.",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "Catálogo de Preços da COLI Distribuidora" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Catálogo de Preços | COLI Distribuidora",
    description: "Consulte produtos, imagens, custos e preços sugeridos para licitações.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
