import { normalizaGtin, type NotaFiscal, type NotaItem } from "./nfe";
import type { Pedido, PedidoItem } from "./pedido";

export type Situacao =
  | "conforme"
  | "qtd_divergente"
  | "emb_divergente"
  | "so_na_nota"
  | "so_no_pedido";

export type ItemConciliado = {
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

export function conciliar(nota: NotaFiscal, pedido: Pedido): Resultado {
  const porEan = new Map<string, PedidoItem>();
  for (const item of pedido.itens) {
    const chave = normalizaGtin(item.ean);
    if (chave) porEan.set(chave, item);
  }

  const usados = new Set<PedidoItem>();
  const itens: ItemConciliado[] = [];

  for (const nItem of nota.itens) {
    const chaveEan = normalizaGtin(nItem.ean);
    const chaveDun = normalizaGtin(nItem.dun);
    const pItem = (chaveEan ? porEan.get(chaveEan) : undefined) ?? (chaveDun ? porEan.get(chaveDun) : undefined);

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
