export type NotaItem = {
  seq: number;
  codigo: string;
  descricao: string;
  ean: string | null;
  dun: string | null;
  embalagem: string;
  qtdComercial: number;
  unidadeTrib: string;
  qtdTributavel: number;
  valorTotal: number;
};

export type NotaFiscal = {
  numero: string;
  serie: string;
  chave: string;
  emitente: string;
  cnpj: string;
  emissao: string | null;
  valorTotal: number;
  itens: NotaItem[];
};

const num = (v: string | null | undefined) => {
  const n = Number.parseFloat((v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export const soDigitos = (v: string | null | undefined) => (v ?? "").replace(/\D/g, "");

/** Normaliza GTIN para comparação: remove zeros à esquerda. */
export const normalizaGtin = (v: string | null | undefined) => {
  const d = soDigitos(v).replace(/^0+/, "");
  return d.length >= 8 ? d : "";
};

const text = (parent: Element | null, tag: string): string => {
  if (!parent) return "";
  const el = parent.getElementsByTagName(tag)[0];
  return el?.textContent?.trim() ?? "";
};

const invalidos = new Set(["SEM GTIN", "SEMGTIN", ""]);

export function parseNotaXml(xml: string): NotaFiscal {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw new Error("Arquivo XML inválido ou corrompido.");
  }
  const infNFe = doc.getElementsByTagName("infNFe")[0];
  if (!infNFe) throw new Error("Este XML não parece ser uma NF-e.");

  const ide = infNFe.getElementsByTagName("ide")[0] ?? null;
  const emit = infNFe.getElementsByTagName("emit")[0] ?? null;
  const total = infNFe.getElementsByTagName("ICMSTot")[0] ?? null;

  const dh = text(ide, "dhEmi") || text(ide, "dEmi");
  const emissao = dh ? dh.slice(0, 10) : null;

  const itens: NotaItem[] = [];
  const dets = Array.from(infNFe.getElementsByTagName("det"));
  dets.forEach((det, i) => {
    const prod = det.getElementsByTagName("prod")[0] ?? null;
    if (!prod) return;

    const codigos = [text(prod, "cEAN"), text(prod, "cEANTrib"), text(prod, "cBarra")]
      .map((c) => c.trim().toUpperCase())
      .filter((c) => !invalidos.has(c))
      .map(soDigitos)
      .filter((c) => c.length >= 8);

    const unicos = Array.from(new Set(codigos));
    // Quando a nota traz DUN (GTIN-14) e EAN juntos, o EAN é a chave de
    // cruzamento com o pedido e o DUN fica como informação de apoio.
    const dun = unicos.find((c) => c.length === 14) ?? null;
    const ean = unicos.find((c) => c.length !== 14) ?? null;

    itens.push({
      seq: Number.parseInt(det.getAttribute("nItem") ?? "", 10) || i + 1,
      codigo: text(prod, "cProd"),
      descricao: text(prod, "xProd"),
      ean,
      dun,
      embalagem: text(prod, "uCom").toUpperCase(),
      qtdComercial: num(text(prod, "qCom")),
      unidadeTrib: text(prod, "uTrib").toUpperCase(),
      qtdTributavel: num(text(prod, "qTrib")),
      valorTotal: num(text(prod, "vProd")),
    });
  });

  return {
    numero: text(ide, "nNF"),
    serie: text(ide, "serie"),
    chave: (infNFe.getAttribute("Id") ?? "").replace(/^NFe/, ""),
    emitente: text(emit, "xNome"),
    cnpj: text(emit, "CNPJ"),
    emissao,
    valorTotal: num(text(total, "vNF")),
    itens,
  };
}
