import { FormEvent } from "react";

export default function ProductForm({ onSubmit, onClose }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void; onClose: () => void }) {
  return <div className="productAdminBackdrop" onMouseDown={onClose}>
    <form className="productAdminForm" onSubmit={onSubmit} onMouseDown={(event) => event.stopPropagation()}>
      <button type="button" className="productAdminClose" onClick={onClose}>×</button>
      <p className="eyebrow">BANCO ONLINE COLI</p>
      <h2>Cadastrar novo produto</h2>
      <div className="productFormGrid">
        <label>Fornecedor<input name="fornecedor" required /></label>
        <label>Código ou SKU<input name="codigo" required /></label>
        <label className="wide">Nome do produto<input name="descricao" required /></label>
        <label>Categoria<input name="categoria" required placeholder="Ex.: Teclados" /></label>
        <label>Unidade<input name="unidade" defaultValue="UN" required /></label>
        <label>Preço de custo<input name="preco_unitario" type="number" min="0" step="0.01" required /></label>
        <label>Situação<select name="status_revisao" defaultValue="Pronto"><option>Pronto</option><option>Revisar</option></select></label>
        <label className="wide">Descrição detalhada<textarea name="descricao_detalhada" required /></label>
        <label className="wide">Características técnicas<textarea name="caracteristicas" placeholder="Uma característica por linha" /></label>
        <label className="wide">Link direto de compra<input name="fonte" type="url" placeholder="https://..." /></label>
        <label className="wide">Endereço da imagem<input name="imagem" type="url" placeholder="https://..." /></label>
      </div>
      <div className="productFormActions"><button type="button" onClick={onClose}>Cancelar</button><button type="submit">Salvar no catálogo</button></div>
    </form>
  </div>;
}
