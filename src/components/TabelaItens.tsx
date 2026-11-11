import { useMemo, useState } from "react";
import { Eye, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  corSituacao,
  fmt,
  rotuloCriterio,
  rotuloSituacao,
  type ItemConciliado,
  type Situacao,
} from "@/lib/conciliacao";
import { DetalheItem } from "@/components/DetalheItem";
import type { NotaFiscal } from "@/lib/nfe";
import type { Pedido } from "@/lib/pedido";

const ordem: Situacao[] = [
  "qtd_divergente",
  "emb_divergente",
  "so_na_nota",
  "so_no_pedido",
  "conforme",
];

function Etiqueta({ situacao }: { situacao: Situacao }) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        corSituacao[situacao],
      )}
    >
      {rotuloSituacao[situacao]}
    </span>
  );
}

function Par({
  rotulo,
  nota,
  pedido,
  dif,
}: {
  rotulo: string;
  nota: string;
  pedido: string;
  dif?: number | null;
}) {
  return (
    <div className="text-xs">
      <span className="text-muted-foreground">{rotulo}: </span>
      <span className="font-mono tabular-nums">{nota}</span>
      <span className="text-muted-foreground"> × </span>
      <span className="font-mono tabular-nums">{pedido}</span>
      {dif ? (
        <span className="ml-1 font-mono font-semibold text-destructive tabular-nums">
          ({dif > 0 ? "+" : ""}
          {fmt(dif)})
        </span>
      ) : null}
    </div>
  );
}

export function TabelaItens({
  itens,
  nota,
  pedido,
}: {
  itens: ItemConciliado[];
  nota: NotaFiscal | null;
  pedido: Pedido | null;
}) {
  const [filtro, setFiltro] = useState<Situacao | "todos">("todos");
  const [busca, setBusca] = useState("");
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const itemSelecionado = selecionado !== null ? (itens[selecionado] ?? null) : null;

  const contagem = useMemo(() => {
    const mapa = new Map<Situacao, number>();
    for (const i of itens) mapa.set(i.situacao, (mapa.get(i.situacao) ?? 0) + 1);
    return mapa;
  }, [itens]);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return itens
      .filter((i) => (filtro === "todos" ? true : i.situacao === filtro))
      .filter((i) =>
        termo
           ? [i.ean, i.dun, i.codigoNota, i.seqPedido, i.descricaoNota, i.descricaoPedido]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(termo))
          : true,
      )
      .sort((a, b) => ordem.indexOf(a.situacao) - ordem.indexOf(b.situacao));
  }, [itens, filtro, busca]);

  function exportar() {
    const cab = [
      "Codigo interno nota",
      "Codigo interno pedido",
      "EAN",
      "DUN",
      "Descricao nota",
      "Descricao pedido",
      "Emb nota",
      "Emb pedido",
      "Caixas nota",
      "Caixas pedido",
      "Unidades nota",
      "Unidades pedido",
      "Dif caixas",
      "Dif unidades",
      "Valor unitario pedido",
      "Valor total pedido",
      "Situacao",
    ];
    const linhas = itens.map((i) =>
      [
        i.codigoNota ?? "",
        i.seqPedido ?? "",
        i.ean ?? "",
        i.dun ?? "",
        i.descricaoNota ?? "",
        i.descricaoPedido ?? "",
        i.embalagemNota ?? "",
        i.embalagemPedido ?? "",
        i.caixasNota ?? "",
        i.caixasPedido ?? "",
        i.unidadesNota ?? "",
        i.unidadesPedido ?? "",
        i.difCaixas ?? "",
        i.difUnidades ?? "",
        i.valorUnitarioPedido == null ? "" : fmt(i.valorUnitarioPedido, 4),
        i.valorTotalPedido == null ? "" : fmt(i.valorTotalPedido),
        rotuloSituacao[i.situacao],
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(";"),
    );
    const blob = new Blob([`\ufeff${[cab.join(";"), ...linhas].join("\n")}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "conciliacao.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <FiltroBotao ativo={filtro === "todos"} onClick={() => setFiltro("todos")}>
          Todos ({itens.length})
        </FiltroBotao>
        {ordem
          .filter((s) => (contagem.get(s) ?? 0) > 0)
          .map((s) => (
            <FiltroBotao key={s} ativo={filtro === s} onClick={() => setFiltro(s)}>
              {rotuloSituacao[s]} ({contagem.get(s)})
            </FiltroBotao>
          ))}
        <div className="ml-auto flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
               placeholder="Buscar código, EAN ou descrição"
               aria-label="Buscar código interno, EAN ou descrição"
              className="pl-8"
            />
          </div>
          <Button variant="outline" onClick={exportar}>
            CSV
          </Button>
        </div>
      </div>

      {/* Tabela em telas grandes */}
      <div className="hidden overflow-x-auto rounded-xl border bg-card lg:block">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Produto</th>
              <th className="px-3 py-2 text-left font-semibold">Código interno</th>
              <th className="px-3 py-2 text-left font-semibold">EAN / DUN</th>
              <th className="px-3 py-2 text-left font-semibold">Embalagem</th>
              <th className="px-3 py-2 text-right font-semibold">Caixas</th>
              <th className="px-3 py-2 text-right font-semibold">Unidades</th>
              <th className="px-3 py-2 text-right font-semibold">Unitário pedido (R$)</th>
              <th className="px-3 py-2 text-right font-semibold">Total pedido (R$)</th>
              <th className="px-3 py-2 text-left font-semibold">Situação</th>
              <th className="px-3 py-2 text-right font-semibold"><span className="sr-only">Detalhe</span></th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((i, idx) => (
              <tr
                key={`${i.ean ?? "s"}-${idx}`}
                onClick={() => setSelecionado(itens.indexOf(i))}
                className="cursor-pointer border-t transition-colors hover:bg-accent/30"
                title="Clique para ver o detalhe do item"
              >
                <td className="max-w-[16rem] px-3 py-2">
                  <p className="truncate font-medium" title={i.descricaoNota ?? ""}>
                    {i.descricaoNota ?? "—"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground" title={i.descricaoPedido ?? ""}>
                    Pedido: {i.descricaoPedido ?? "—"}
                  </p>
                </td>
                 <td className="px-3 py-2 text-xs">
                   <p className="whitespace-nowrap"><span className="text-muted-foreground">Nota: </span><span className="font-mono">{i.codigoNota || "—"}</span></p>
                   <p className="whitespace-nowrap"><span className="text-muted-foreground">Pedido: </span><span className="font-mono">{i.seqPedido || "—"}</span></p>
                 </td>
                 <td className="px-3 py-2 font-mono text-xs">
                  <p>{i.ean ?? "—"}</p>
                  {i.dun ? <p className="text-muted-foreground">DUN {i.dun}</p> : null}
                </td>
                <td className="px-3 py-2 text-xs">
                  <span className="font-mono">{i.embalagemNota ?? "—"}</span>
                  <span className="text-muted-foreground"> × </span>
                  <span className="font-mono">{i.embalagemPedido ?? "—"}</span>
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                  {fmt(i.caixasNota)} <span className="text-muted-foreground">×</span>{" "}
                  {fmt(i.caixasPedido)}
                  {i.difCaixas ? (
                    <span className="ml-1 font-semibold text-destructive">
                      ({i.difCaixas > 0 ? "+" : ""}
                      {fmt(i.difCaixas)})
                    </span>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                  {fmt(i.unidadesNota)} <span className="text-muted-foreground">×</span>{" "}
                  {fmt(i.unidadesPedido)}
                  {i.difUnidades ? (
                    <span className="ml-1 font-semibold text-destructive">
                      ({i.difUnidades > 0 ? "+" : ""}
                      {fmt(i.difUnidades)})
                    </span>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-xs tabular-nums">
                  {fmt(i.valorUnitarioPedido, 4)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-xs tabular-nums">
                  {fmt(i.valorTotalPedido)}
                </td>
                <td className="px-3 py-2">
                  <Etiqueta situacao={i.situacao} />
                  {i.criterio ? (
                    <p className="mt-1 whitespace-nowrap text-[11px] text-muted-foreground">Por {rotuloCriterio[i.criterio].toLowerCase()}</p>
                  ) : null}
                </td>
                <td className="px-3 py-2 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelecionado(itens.indexOf(i));
                    }}
                  >
                    <Eye className="size-4" /> Ver
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visiveis.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Nenhum item nesse filtro.</p>
        ) : null}
      </div>

      {/* Fichas no celular */}
      <div className="space-y-2 lg:hidden">
        {visiveis.map((i, idx) => (
          <div
            key={`${i.ean ?? "s"}-m-${idx}`}
            onClick={() => setSelecionado(itens.indexOf(i))}
            className="cursor-pointer rounded-xl border bg-card p-3 shadow-sm transition-colors hover:bg-accent/30"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="min-w-0 flex-1 basis-40 break-words text-sm font-medium leading-tight">{i.descricaoNota ?? i.descricaoPedido ?? "—"}</p>
              <div className="flex items-center gap-2">
                <Etiqueta situacao={i.situacao} />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelecionado(itens.indexOf(i));
                  }}
                >
                  <Eye className="size-4" /> Ver
                </Button>
              </div>
            </div>
            {i.criterio ? <p className="mt-1 text-[11px] text-muted-foreground">Conciliado por {rotuloCriterio[i.criterio].toLowerCase()}</p> : null}
            {i.descricaoNota && i.descricaoPedido ? <p className="mt-1 break-words text-xs text-muted-foreground">Pedido: {i.descricaoPedido}</p> : null}
            <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-muted-foreground">Código interno · Nota</dt>
                <dd className="break-all font-mono">{i.codigoNota || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Código interno · Pedido</dt>
                <dd className="break-all font-mono">{i.seqPedido || "—"}</dd>
              </div>
            </dl>
            <p className="mt-1 font-mono text-xs text-muted-foreground">
              {i.ean ?? "—"}
              {i.dun ? ` · DUN ${i.dun}` : ""}
            </p>
            <div className="mt-2 space-y-0.5">
              <div className="text-xs">
                <span className="text-muted-foreground">Embalagem: </span>
                <span className="font-mono">
                  {i.embalagemNota ?? "—"} × {i.embalagemPedido ?? "—"}
                </span>
              </div>
              <Par
                rotulo="Caixas"
                nota={fmt(i.caixasNota)}
                pedido={fmt(i.caixasPedido)}
                dif={i.difCaixas}
              />
              <Par
                rotulo="Unidades"
                nota={fmt(i.unidadesNota)}
                pedido={fmt(i.unidadesPedido)}
                dif={i.difUnidades}
              />
              <dl className="mt-2 grid grid-cols-2 gap-2 border-t pt-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Unitário pedido (R$)</dt>
                  <dd className="font-mono tabular-nums">{fmt(i.valorUnitarioPedido, 4)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Total pedido (R$)</dt>
                  <dd className="font-mono font-semibold tabular-nums">{fmt(i.valorTotalPedido)}</dd>
                </div>
              </dl>
            </div>
          </div>
        ))}
        {visiveis.length === 0 ? (
          <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            Nenhum item nesse filtro.
          </p>
        ) : null}
      </div>

      <DetalheItem
        item={itemSelecionado}
        indice={selecionado ?? 0}
        total={itens.length}
        nota={nota}
        pedido={pedido}
        onFechar={() => setSelecionado(null)}
      />
    </div>
  );
}

function FiltroBotao({
  ativo,
  onClick,
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      aria-pressed={ativo}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        ativo
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-accent/40",
      )}
    >
      {children}
    </Button>
  );
}
