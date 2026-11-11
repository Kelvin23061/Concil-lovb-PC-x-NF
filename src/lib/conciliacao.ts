import { normalizaGtin, type NotaFiscal, type NotaItem } from "./nfe";
import type { Pedido, PedidoItem } from "./pedido";

export type Situacao =
  | "conforme"
  | "qtd_divergente"
  | "emb_divergente"
  | "so_na_nota"
  | "so_no_pedido";

export type Criterio = "codigo_barras" | "referencia" | "descricao";

export const rotuloCriterio: Record<Criterio, string> = {
  codigo_barras: "Código de barras",
  referencia: "Referência",
  descricao: "Descrição",
};

export type ItemConciliado = {
  /** Como o item da nota foi ligado ao pedido. */
  criterio?: Criterio | null;
  ean: string | null;
  dun: string | null;
  descricaoNota: string | null;
  descricaoPedido: string | null;
  embalagemNota: string | null;
  embalagemPedido: string | null;
  caixasNota: number | null;
  caixasPedido: number | null;
  unidadesNota: number | null;
  unidadesPedido: number | null;
  difCaixas: number | null;
  difUnidades: number | null;
  situacao: Situacao;
  // Detalhamento do item (tela de detalhe)
  seqNota: number | null;
  seqPedido: string | null;
  codigoNota: string | null;
  unidadeTrib: string | null;
  valorUnitarioNota: number | null;
  valorTotalNota: number | null;
  valorUnitarioPedido: number | null;
  valorTotalPedido: number | null;
};

export type Resultado = {
  itens: ItemConciliado[];
  totalItens: number;
  conformes: number;
  divergentes: number;
};

const TOL = 0.001;
const arred = (n: number) => Math.round(n * 1000) / 1000;
const unidadesSoltas = new Set(["UN", "UND", "UNID", "PC", "PÇ", "PECA", "KG", "LT", "L", "ML"]);

function embFatorPedido(item: PedidoItem) {
  return item.embalagemFator > 0 ? item.embalagemFator : 1;
}

/** Converte o item da nota em caixas e unidades, usando o fator do pedido como apoio. */
function quantidadesNota(item: NotaItem, fatorPedido: number) {
  const fatorNota =
    item.qtdComercial > 0 && item.qtdTributavel > item.qtdComercial
      ? item.qtdTributavel / item.qtdComercial
      : 1;

  if (fatorNota > 1) {
    return { caixas: item.qtdComercial, unidades: item.qtdTributavel, fator: fatorNota };
  }
  const embPack = !unidadesSoltas.has(item.embalagem) && item.embalagem !== "";
  if (embPack && fatorPedido > 1) {
    return {
      caixas: item.qtdComercial,
      unidades: item.qtdComercial * fatorPedido,
      fator: fatorPedido,
    };
  }
  if (fatorPedido > 1) {
    return {
      caixas: item.qtdComercial / fatorPedido,
      unidades: item.qtdComercial,
      fator: 1,
    };
  }
  return { caixas: item.qtdComercial, unidades: item.qtdComercial, fator: 1 };
}

const gtinsNota = (i: NotaItem) =>
  Array.from(new Set([i.ean, i.dun, ...(i.gtins ?? [])].map(normalizaGtin).filter(Boolean)));
const gtinsPedido = (i: PedidoItem) =>
  Array.from(new Set([i.ean, ...(i.gtins ?? [])].map(normalizaGtin).filter(Boolean)));

const semAcento = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
const palavras = (v: string | null | undefined) =>
  new Set(semAcento(v ?? "").split(/[^A-Z0-9]+/).filter((w) => w.length >= 2));

/** Semelhança entre descrições (0 a 1), pela proporção de palavras em comum. */
export function semelhancaDescricao(a: string | null | undefined, b: string | null | undefined) {
  const pa = palavras(a);
  const pb = palavras(b);
  if (pa.size === 0 || pb.size === 0) return 0;
  let comuns = 0;
  for (const w of pa) if (pb.has(w)) comuns++;
  return comuns / Math.min(pa.size, pb.size);
}

const LIMIAR_DESCRICAO = 0.7;

function referenciaConfere(n: NotaItem, p: PedidoItem) {
  const ref = semAcento(n.codigo ?? "").replace(/^0+/, "");
  if (ref.length < 3) return false;
  if (semAcento(p.seq).replace(/^0+/, "") === ref) return true;
  return Array.from(palavras(p.descricao)).some((w) => w.replace(/^0+/, "") === ref);
}

/**
 * Liga cada item da nota a um item do pedido: primeiro por qualquer código de
 * barras (EAN/DUN, inclusive quando há mais de um), depois pela referência e,
 * por fim, pela descrição.
 */
function vincular(nota: NotaFiscal, pedido: Pedido) {
  const livres = new Set(pedido.itens);
  const vinculo = new Map<NotaItem, { item: PedidoItem; criterio: Criterio }>();

  const porGtin = new Map<string, PedidoItem[]>();
  for (const p of pedido.itens)
    for (const g of gtinsPedido(p)) porGtin.set(g, [...(porGtin.get(g) ?? []), p]);

  for (const n of nota.itens) {
    // EAN antes do DUN quando a nota traz os dois.
    for (const g of gtinsNota(n).sort((a, b) => (a.length === 14 ? 1 : 0) - (b.length === 14 ? 1 : 0))) {
      const p = (porGtin.get(g) ?? []).find((x) => livres.has(x));
      if (p) {
        vinculo.set(n, { item: p, criterio: "codigo_barras" });
        livres.delete(p);
        break;
      }
    }
  }
  for (const n of nota.itens) {
    if (vinculo.has(n)) continue;
    const p = Array.from(livres).find((x) => referenciaConfere(n, x));
    if (p) {
      vinculo.set(n, { item: p, criterio: "referencia" });
      livres.delete(p);
    }
  }
  for (const n of nota.itens) {
    if (vinculo.has(n)) continue;
    let melhor: PedidoItem | null = null;
    let nota_ = 0;
    for (const p of livres) {
      const s = semelhancaDescricao(n.descricao, p.descricao);
      if (s > nota_) {
        nota_ = s;
        melhor = p;
      }
    }
    if (melhor && nota_ >= LIMIAR_DESCRICAO) {
      vinculo.set(n, { item: melhor, criterio: "descricao" });
      livres.delete(melhor);
    }
  }
  return vinculo;
}

export function conciliar(nota: NotaFiscal, pedido: Pedido): Resultado {
  const vinculo = vincular(nota, pedido);
  const usados = new Set<PedidoItem>();
  const itens: ItemConciliado[] = [];

  for (const nItem of nota.itens) {
    const v = vinculo.get(nItem);
    const pItem = v?.item;

    if (!pItem) {
      const q = quantidadesNota(nItem, 1);
      itens.push({
        ean: nItem.ean,
        dun: nItem.dun,
        descricaoNota: nItem.descricao,
        descricaoPedido: null,
        embalagemNota: nItem.embalagem,
        embalagemPedido: null,
        caixasNota: arred(q.caixas),
        caixasPedido: null,
        unidadesNota: arred(q.unidades),
        unidadesPedido: null,
        difCaixas: null,
        difUnidades: null,
        situacao: "so_na_nota",
        criterio: null,
        seqNota: nItem.seq,
        seqPedido: null,
        codigoNota: nItem.codigo,
        unidadeTrib: nItem.unidadeTrib,
        valorUnitarioNota: nItem.qtdTributavel > 0 ? arred(nItem.valorTotal / nItem.qtdTributavel) : null,
        valorTotalNota: arred(nItem.valorTotal),
        valorUnitarioPedido: null,
        valorTotalPedido: null,
      });
      continue;
    }

    usados.add(pItem);
    const fatorPedido = embFatorPedido(pItem);
    const q = quantidadesNota(nItem, fatorPedido);
    const caixasPedido = pItem.quantidade;
    const unidadesPedido = pItem.quantidade * fatorPedido;
    const difCaixas = arred(q.caixas - caixasPedido);
    const difUnidades = arred(q.unidades - unidadesPedido);
    const embDiferente = Math.abs(q.fator - fatorPedido) > TOL;

    const situacao: Situacao =
      Math.abs(difCaixas) > TOL || Math.abs(difUnidades) > TOL
        ? "qtd_divergente"
        : embDiferente
          ? "emb_divergente"
          : "conforme";

    itens.push({
      ean: nItem.ean ?? pItem.ean,
      dun: nItem.dun,
      descricaoNota: nItem.descricao,
      descricaoPedido: pItem.descricao,
      embalagemNota: nItem.embalagem,
      embalagemPedido: pItem.embalagem,
      caixasNota: arred(q.caixas),
      caixasPedido: arred(caixasPedido),
      unidadesNota: arred(q.unidades),
      unidadesPedido: arred(unidadesPedido),
      difCaixas,
      difUnidades,
      situacao,
      criterio: v?.criterio ?? null,
      seqNota: nItem.seq,
      seqPedido: pItem.seq,
      codigoNota: nItem.codigo,
      unidadeTrib: nItem.unidadeTrib,
      valorUnitarioNota: nItem.qtdTributavel > 0 ? arred(nItem.valorTotal / nItem.qtdTributavel) : null,
      valorTotalNota: arred(nItem.valorTotal),
      valorUnitarioPedido: arred(pItem.valorUnitario),
      valorTotalPedido: arred(pItem.quantidade * pItem.valorUnitario),
    });
  }

  for (const pItem of pedido.itens) {
    if (usados.has(pItem)) continue;
    const fator = embFatorPedido(pItem);
    itens.push({
      ean: pItem.ean,
      dun: null,
      descricaoNota: null,
      descricaoPedido: pItem.descricao,
      embalagemNota: null,
      embalagemPedido: pItem.embalagem,
      caixasNota: null,
      caixasPedido: arred(pItem.quantidade),
      unidadesNota: null,
      unidadesPedido: arred(pItem.quantidade * fator),
      difCaixas: null,
      difUnidades: null,
      situacao: "so_no_pedido",
      criterio: null,
      seqNota: null,
      seqPedido: pItem.seq,
      codigoNota: null,
      unidadeTrib: null,
      valorUnitarioNota: null,
      valorTotalNota: null,
      valorUnitarioPedido: arred(pItem.valorUnitario),
      valorTotalPedido: arred(pItem.quantidade * pItem.valorUnitario),
    });
  }

  const conformes = itens.filter((i) => i.situacao === "conforme").length;
  return {
    itens,
    totalItens: itens.length,
    conformes,
    divergentes: itens.length - conformes,
  };
}

export const rotuloSituacao: Record<Situacao, string> = {
  conforme: "Conforme",
  qtd_divergente: "Quantidade divergente",
  emb_divergente: "Embalagem divergente",
  so_na_nota: "Só na nota",
  so_no_pedido: "Só no pedido",
};

export const corSituacao: Record<Situacao, string> = {
  conforme: "bg-ok/15 text-ok border-ok/30",
  qtd_divergente: "bg-destructive/15 text-destructive border-destructive/30",
  emb_divergente: "bg-warn/15 text-warn border-warn/30",
  so_na_nota: "bg-destructive/15 text-destructive border-destructive/30",
  so_no_pedido: "bg-warn/15 text-warn border-warn/30",
};

export const fmt = (n: number | null | undefined, dec = 2) =>
  n === null || n === undefined
    ? "—"
    : n.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
