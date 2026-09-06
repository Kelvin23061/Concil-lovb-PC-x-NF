import { CheckCircle2, AlertTriangle, Layers, Receipt } from "lucide-react";
import type { Resultado } from "@/lib/conciliacao";
import { fmt } from "@/lib/conciliacao";
import { cn } from "@/lib/utils";

type Props = { resultado: Resultado; valorNota: number };

export function CartoesResumo({ resultado, valorNota }: Props) {
  const pct = resultado.totalItens
    ? Math.round((resultado.conformes / resultado.totalItens) * 100)
    : 0;

  const cartoes = [
    {
      rotulo: "Itens comparados",
      valor: String(resultado.totalItens),
      icone: <Layers className="size-4" />,
      cor: "text-foreground",
    },
    {
      rotulo: "Conformes",
      valor: String(resultado.conformes),
      icone: <CheckCircle2 className="size-4" />,
      cor: "text-ok",
    },
    {
      rotulo: "Divergentes",
      valor: String(resultado.divergentes),
      icone: <AlertTriangle className="size-4" />,
      cor: resultado.divergentes ? "text-destructive" : "text-muted-foreground",
    },
    {
      rotulo: "Valor da nota",
      valor: `R$ ${fmt(valorNota)}`,
      icone: <Receipt className="size-4" />,
      cor: "text-foreground",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cartoes.map((c) => (
          <div
            key={c.rotulo}
            className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className={c.cor}>{c.icone}</span>
              {c.rotulo}
            </div>
            <p className={cn("mt-2 font-mono text-2xl font-semibold tabular-nums", c.cor)}>
              {c.valor}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-muted-foreground">Conformidade da nota</span>
          <span className="font-mono tabular-nums">{pct}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-to-r from-ok to-chart-1 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
