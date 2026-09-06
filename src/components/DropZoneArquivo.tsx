import { useRef, useState, type ReactNode } from "react";
import { FileCheck2, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  titulo: string;
  descricao: string;
  accept: string;
  icone: ReactNode;
  arquivo: File | null;
  resumo?: ReactNode;
  erro?: string | null;
  onArquivo: (file: File | null) => void;
};

export function DropZoneArquivo({
  titulo,
  descricao,
  accept,
  icone,
  arquivo,
  resumo,
  erro,
  onArquivo,
}: Props) {
  const [sobre, setSobre] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setSobre(true);
      }}
      onDragLeave={() => setSobre(false)}
      onDrop={(e) => {
        e.preventDefault();
        setSobre(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onArquivo(file);
      }}
      className={cn(
        "group relative flex flex-col rounded-xl border border-dashed bg-card p-5 transition-all duration-200",
        sobre ? "border-primary bg-accent/40 ring-2 ring-primary/30" : "border-border",
        arquivo && !erro && "border-solid border-ok/40",
        erro && "border-solid border-destructive/50",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground transition-colors",
            arquivo && !erro && "bg-ok/15 text-ok",
          )}
        >
          {arquivo && !erro ? <FileCheck2 className="size-5" /> : icone}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">{titulo}</h3>
          <p className="text-xs text-muted-foreground">{descricao}</p>
        </div>
        {arquivo ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Remover arquivo"
            onClick={() => {
              onArquivo(null);
              if (input.current) input.current.value = "";
            }}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      <div className="mt-4">
        {arquivo ? (
          <div className="space-y-1">
            <p className="truncate font-mono text-xs text-foreground">{arquivo.name}</p>
            {resumo}
          </div>
        ) : (
          <Button variant="secondary" className="w-full" onClick={() => input.current?.click()}>
            <UploadCloud className="mr-2 size-4" />
            Selecionar ou arrastar
          </Button>
        )}
        {erro ? <p className="mt-2 text-xs font-medium text-destructive">{erro}</p> : null}
      </div>

      <input
        ref={input}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onArquivo(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
