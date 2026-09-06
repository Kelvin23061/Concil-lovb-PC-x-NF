import { Trash2, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Conferencia } from "@/lib/historico";
import { fmt } from "@/lib/conciliacao";

type Props = {
  itens: Conferencia[];
  onAbrir: (c: Conferencia) => void;
  onRemover: (id: string) => void;
};

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function ListaHistorico({ itens, onAbrir, onRemover }: Props) {
  if (itens.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card p-10 text-center">
        <FileSearch className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">Nenhuma conferência nos últimos 7 dias</p>
        <p className="mt-1 text-xs text-muted-foreground">
          As conferências ficam salvas neste navegador por 7 dias.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {itens.map((c) => (
        <div
          key={c.id}
          className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              NF {c.nota.numero || "—"}
              {c.nota.serie ? `/${c.nota.serie}` : ""} · {c.nota.emitente || "Fornecedor"}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Pedido {c.pedido.numero || "—"} · {dataHora(c.salvoEm)} · R$ {fmt(c.nota.valorTotal)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                c.resultado.divergentes
                  ? "border-destructive/30 bg-destructive/15 text-destructive"
                  : "border-ok/30 bg-ok/15 text-ok"
              }`}
            >
              {c.resultado.divergentes
                ? `${c.resultado.divergentes} divergência${c.resultado.divergentes > 1 ? "s" : ""}`
                : "Tudo conforme"}
            </span>
            <Button variant="outline" size="sm" onClick={() => onAbrir(c)}>
              Abrir
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              aria-label="Apagar conferência"
              onClick={() => onRemover(c.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
