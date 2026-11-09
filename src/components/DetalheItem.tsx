import { Barcode, FileText, ReceiptText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  corSituacao,
  fmt,
  rotuloSituacao,
  type ItemConciliado,
} from "@/lib/conciliacao";
import type { NotaFiscal } from "@/lib/nfe";
import type { Pedido } from "@/lib/pedido";

type Props = {
  item: ItemConciliado | null;
  indice: number;
  total: number;
  nota: NotaFiscal | null;
  pedido: Pedido | null;
  onFechar: () => void;
};

function Campo({ rotulo, valor, mono = true }: { rotulo: string; valor: string | null | undefined; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{rotulo}</p>
      <p className={cn("mt-0.5 break-words text-sm", mono && "font-mono tabular-nums")}>{valor || "—"}</p>
    </div>
  );
}

function LinhaComparacao({
  rotulo,
  pedido,
  nota,
  diferenca,
  divergente,
  dec = 2,
}: {
  rotulo: string;
  pedido: number | null;
  nota: number | null;
  diferenca: number | null;
  divergente: boolean;
  dec?: number;
}) {
  const vazio = pedido === null && nota === null;
  if (vazio) return null;
  return (
    <tr className={cn("border-t", divergente && "bg-destructive/10")}>
      <td className="px-3 py-2 text-sm font-medium">{rotulo}</td>
      <td className={cn("px-3 py-2 text-right font-mono text-sm tabular-nums", divergente && "font-semibold text-destructive")}>
        {fmt(pedido, dec)}
      </td>
      <td className={cn("px-3 py-2 text-right font-mono text-sm tabular-nums", divergente && "font-semibold text-destructive")}>
        {fmt(nota, dec)}
      </td>
      <td className={cn("px-3 py-2 text-right font-mono text-sm tabular-nums", divergente && "font-semibold text-destructive")}>
        {diferenca === null
          ? "—"
          : `${diferenca > 0 ? "+" : ""}${fmt(diferenca === 0 ? 0 : diferenca, dec)}`}
      </td>
    </tr>
  );
}

export function DetalheItem({ item, indice, total, nota, pedido, onFechar }: Props) {
  const aberto = item !== null;
  // Diferença sempre no sentido Pedido − Nota, como no relatório de referência.
  const difUnit =
    item?.valorUnitarioNota != null && item?.valorUnitarioPedido != null
      ? Math.round((item.valorUnitarioPedido - item.valorUnitarioNota) * 1000) / 1000
      : null;
  const difTotal =
    item?.valorTotalNota != null && item?.valorTotalPedido != null
      ? Math.round((item.valorTotalPedido - item.valorTotalNota) * 100) / 100
      : null;
  const TOL = 0.001;

  return (
    <Dialog open={aberto} onOpenChange={(v) => (!v ? onFechar() : undefined)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        {item ? (
          <>
            <DialogHeader>
              <DialogDescription className="text-[11px] font-semibold uppercase tracking-wider">
                Item {indice + 1} de {total}
                {item.ean ? " · vínculo por código de barras" : ""}
              </DialogDescription>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <DialogTitle className="text-base leading-snug">
                  {item.descricaoNota ?? item.descricaoPedido ?? "Item"}
                </DialogTitle>
                <span
                  className={cn(
                    "inline-flex shrink-0 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                    corSituacao[item.situacao],
                  )}
                >
                  {rotuloSituacao[item.situacao]}
                </span>
              </div>
            </DialogHeader>

            <div className="grid gap-3 md:grid-cols-2">
              {/* Pedido de compra */}
              <section className="space-y-3 rounded-xl border bg-card p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <FileText className="size-4 text-primary" />
                  Pedido de compra{pedido?.numero ? ` · ${pedido.numero}` : ""}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Campo rotulo="Código interno" valor={item.seqPedido} />
                  <Campo rotulo="Código de barras" valor={item.ean} />
                  <Campo rotulo="Embalagem" valor={item.embalagemPedido} />
                  <Campo rotulo="Quantidade" valor={item.caixasPedido !== null ? fmt(item.caixasPedido) : null} />
                </div>
                <Campo rotulo="Descrição" valor={item.descricaoPedido} mono={false} />
                <Campo rotulo="Fornecedor" valor={pedido?.fornecedor} mono={false} />
              </section>

              {/* Nota fiscal */}
              <section className="space-y-3 rounded-xl border bg-card p-4">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <ReceiptText className="size-4 text-primary" />
                  Nota fiscal{nota?.numero ? ` · ${nota.numero}` : ""}
                  {item.dun ? <Barcode className="ml-auto size-4 text-muted-foreground" /> : null}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Campo rotulo="Código do produto" valor={item.codigoNota} />
                  <Campo rotulo="Embalagem (un. comercial)" valor={item.embalagemNota} />
                  <Campo
                    rotulo="EAN / EAN trib."
                    valor={item.dun ? `${item.ean ?? "—"} / ${item.dun}` : item.ean}
                  />
                  <Campo rotulo="Unidade tributável" valor={item.unidadeTrib} />
                </div>
                <Campo rotulo="Descrição" valor={item.descricaoNota} mono={false} />
                <Campo rotulo="Emitente" valor={nota?.emitente} mono={false} />
              </section>
            </div>

            {/* Comparação de valores */}
            <section className="overflow-hidden rounded-xl border bg-card">
              <p className="border-b px-4 py-2.5 text-sm font-semibold">Comparação de valores</p>
              <table className="w-full border-collapse">
                <thead className="bg-secondary/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Campo</th>
                    <th className="px-3 py-2 text-right font-semibold">Pedido</th>
                    <th className="px-3 py-2 text-right font-semibold">Nota fiscal</th>
                    <th className="px-3 py-2 text-right font-semibold">Diferença</th>
                  </tr>
                </thead>
                <tbody>
                  <LinhaComparacao
                    rotulo="Caixas"
                    pedido={item.caixasPedido}
                    nota={item.caixasNota}
                    diferenca={item.difCaixas !== null ? -item.difCaixas : null}
                    divergente={item.difCaixas !== null && Math.abs(item.difCaixas) > TOL}
                  />
                  <LinhaComparacao
                    rotulo="Unidades"
                    pedido={item.unidadesPedido}
                    nota={item.unidadesNota}
                    diferenca={item.difUnidades !== null ? -item.difUnidades : null}
                    divergente={item.difUnidades !== null && Math.abs(item.difUnidades) > TOL}
                  />
                  <LinhaComparacao
                    rotulo="Valor unitário"
                    pedido={item.valorUnitarioPedido}
                    nota={item.valorUnitarioNota}
                    diferenca={difUnit}
                    divergente={difUnit !== null && Math.abs(difUnit) > TOL}
                    dec={4}
                  />
                  <LinhaComparacao
                    rotulo="Valor total"
                    pedido={item.valorTotalPedido}
                    nota={item.valorTotalNota}
                    diferenca={difTotal}
                    divergente={difTotal !== null && Math.abs(difTotal) > 0.01}
                  />
                </tbody>
              </table>
            </section>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
