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
  const plano = texto.replace(/\n/g, " \n ");
  const linear = texto.replace(/\s*\n\s*/g, " ");

  const numero = capturar(linear, /PEDIDO DE COMPRAS\s+(\d+\s*\/?\s*[A-Z]?)/i).replace(/\s+/g, "");
  const fornecedor = capturar(plano, /R\.?\s*Social\s+(.+?)(?:\s*\n|\s{2,}Endere)/i);
  const cnpj = soDigitos(capturar(linear, /CNPJ\s*([\d.\-/\s]{14,25})/i));
  const dataEmissao = capturar(linear, /Data da emiss[aã]o\s*(\d{2}\/\d{2}\/\d{4})/i);
  const emissao = dataEmissao
    ? `${dataEmissao.slice(6, 10)}-${dataEmissao.slice(3, 5)}-${dataEmissao.slice(0, 2)}`
    : null;
  const valorTotal = numBr(capturar(linear, /Valor total do pedido\s*([\d.,]+)/i) || "0");

  const itens: PedidoItem[] = [];
  const reEan = /EANs?\s*:?\s*(\d{8,14})/gi;
  let match: RegExpExecArray | null;
  let anterior = 0;

  while ((match = reEan.exec(linear)) !== null) {
    const antes = linear.slice(anterior, match.index);
    const depois = linear.slice(match.index + match[0].length, match.index + match[0].length + 160);
    anterior = match.index + match[0].length;

    const seqMatch = antes.match(/(\d{4,8})(?!.*\d{4,8})\s*([^\d]*)$/);
    const seq = seqMatch?.[1] ?? "";
    let descricao = (seqMatch ? antes.slice(antes.lastIndexOf(seq) + seq.length) : antes)
      .replace(/\s+/g, " ")
      .trim();
    if (descricao.length > 120) descricao = descricao.slice(-120).trim();

    const emb = depois.match(/\b([A-Z]{2,4})\s*(\d+(?:[.,]\d+)?)?\b/);
    const embalagemSigla = emb?.[1] ?? "";
    const embalagemFator = emb?.[2] ? numBr(emb[2]) : 1;
    const embalagem = embalagemSigla
      ? `${embalagemSigla}${embalagemFator > 1 ? " " + String(embalagemFator) : ""}`
      : "";

    const restante = emb ? depois.slice((emb.index ?? 0) + emb[0].length) : depois;
    const numeros = Array.from(restante.matchAll(/-?[\d.]*\d,\d{2,4}/g)).map((m) => numBr(m[0]));

    itens.push({
      seq,
      descricao,
      ean: soDigitos(match[1]),
      embalagem,
      embalagemFator: embalagemFator > 0 ? embalagemFator : 1,
      quantidade: numeros[0] ?? 0,
      valorUnitario: numeros[2] ?? 0,
    });
  }

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
