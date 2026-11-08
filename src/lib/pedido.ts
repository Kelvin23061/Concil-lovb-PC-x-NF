import { soDigitos } from "./nfe";

export type PedidoItem = {
  seq: string;
  descricao: string;
  ean: string | null;
  embalagem: string;
  embalagemFator: number;
  quantidade: number;
  valorUnitario: number;
};

export type Pedido = {
  numero: string;
  fornecedor: string;
  cnpj: string;
  emissao: string | null;
  valorTotal: number;
  itens: PedidoItem[];
};

const numBr = (v: string) => {
  const n = Number.parseFloat(v.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

/** Extrai o texto do PDF no navegador, linha por linha. */
export async function extrairTextoPdf(file: File): Promise<string> {
  const [{ getDocument, GlobalWorkerOptions }, workerUrl] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url").then((m) => m.default as string),
  ]);
  GlobalWorkerOptions.workerSrc = workerUrl;

  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const linhas: string[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const porLinha = new Map<number, { x: number; str: string }[]>();

    for (const item of content.items as Array<{ str: string; transform: number[] }>) {
      if (!item.str || !item.str.trim()) continue;
      const y = Math.round((item.transform[5] ?? 0) / 3);
      const x = item.transform[4] ?? 0;
      const arr = porLinha.get(y) ?? [];
      arr.push({ x, str: item.str });
      porLinha.set(y, arr);
    }

    const ys = Array.from(porLinha.keys()).sort((a, b) => b - a);
    for (const y of ys) {
      const linha = (porLinha.get(y) ?? [])
        .sort((a, b) => a.x - b.x)
        .map((i) => i.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (linha) linhas.push(linha);
    }
  }

  return linhas.join("\n");
}

const capturar = (texto: string, re: RegExp) => texto.match(re)?.[1]?.trim() ?? "";

/** Interpreta o texto do pedido de compras (modelo Concinco / TOTVS). */
export function parsePedidoTexto(texto: string): Pedido {
  const linear = texto.replace(/\s*\n\s*/g, " ");

  const numero = capturar(linear, /PEDIDO DE COMPRAS\s+(\d+(?:\s*\/\s*[A-Z])?)/i).replace(/\s+/g, "");
  // A primeira coluna é o fornecedor; a segunda contém o comprador.
  const fornecedor = capturar(texto, /R\.?\s*Social\s+([^\n]+?)(?=\s+R\.?\s*Social|\n|$)/i);
  const cnpj = soDigitos(capturar(linear, /CNPJ\s*([\d.\-/\s]{14,25})/i));
  const dataEmissao = capturar(linear, /Data da emiss[aã]o\s*(\d{2}\/\d{2}\/\d{4})/i);
  const emissao = dataEmissao
    ? `${dataEmissao.slice(6, 10)}-${dataEmissao.slice(3, 5)}-${dataEmissao.slice(0, 2)}`
    : null;
  const valorTotal = numBr(capturar(linear, /Valor total do pedido\s*([\d.,]+)/i) || "0");

  const itens: PedidoItem[] = [];
  let atual: PedidoItem | null = null;
  for (const linha of texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
    // O EAN vem abaixo do produto; embalagem e valores ficam na linha inicial.
    const inicio = linha.match(/^(\d{4,8})(?:\s+(\d{1,3}))?\s+(.+?)\s+(CX|FD|UN|UND|PC|PCT|LT|KG|SC|DZ|PT)\s*(\d+(?:[.,]\d+)?)?\s+(-?[\d.]+,\d{2,4})\s+(.+)$/i);
    if (inicio) {
      if (atual) throw new Error("Há um produto sem EAN no pedido. Verifique o PDF completo.");
      const fator = inicio[5] ? numBr(inicio[5]) : 1;
      const numeros = Array.from(inicio[7].matchAll(/-?[\d.]+,\d{2,4}/g)).map((m) => numBr(m[0]));
      atual = {
        seq: inicio[2] ?? inicio[1],
        descricao: inicio[3].trim(),
        ean: null,
        embalagem: `${inicio[4].toUpperCase()}${fator > 1 ? ` ${fator}` : ""}`,
        embalagemFator: fator > 0 ? fator : 1,
        quantidade: numBr(inicio[6]),
        valorUnitario: numeros[1] ?? 0,
      };
      continue;
    }
    const ean = linha.match(/EANs?\s*:?\s*(\d{8,14})/i);
    if (ean) {
      if (!atual) throw new Error("Não foi possível identificar a embalagem e a quantidade de um produto do pedido.");
      atual.ean = soDigitos(ean[1]);
      itens.push(atual);
      atual = null;
    } else if (atual && !/^(PEDIDO DE|Cod Forn|TOTAIS|FORNECEDOR)/i.test(linha)) {
      atual.descricao += ` ${linha}`;
    }
  }
  if (atual) throw new Error("Há um produto sem EAN no pedido. Verifique o PDF completo.");

  return { numero, fornecedor, cnpj, emissao, valorTotal, itens };
}

export async function lerPedidoPdf(file: File): Promise<Pedido> {
  const texto = await extrairTextoPdf(file);
  const pedido = parsePedidoTexto(texto);
  if (pedido.itens.length === 0) {
    throw new Error(
      "Não foi possível localizar os itens no PDF do pedido. Verifique se é o pedido de compras completo.",
    );
  }
  return pedido;
}
