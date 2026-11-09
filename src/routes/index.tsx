import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { FileCode2, FileText, History, Loader2, ScanSearch } from "lucide-react";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DropZoneArquivo } from "@/components/DropZoneArquivo";
import { CartoesResumo } from "@/components/CartoesResumo";
import { TabelaItens } from "@/components/TabelaItens";
import { ListaHistorico } from "@/components/ListaHistorico";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseNotaXml, type NotaFiscal } from "@/lib/nfe";
import { lerPedidoPdf, type Pedido } from "@/lib/pedido";
import { conciliar, type Resultado } from "@/lib/conciliacao";
import {
  listarHistorico,
  removerConferencia,
  salvarConferencia,
  type Conferencia,
} from "@/lib/historico";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Conciliador NF-e x Pedido de Compras" },
      {
        name: "description",
        content:
          "Compare o XML da nota fiscal com o PDF do pedido de compras por EAN e DUN: embalagem, caixas e unidades, com histórico de 7 dias.",
      },
      { property: "og:title", content: "Conciliador NF-e x Pedido de Compras" },
      {
        property: "og:description",
        content:
          "Confira nota e pedido item por item: EAN/DUN, embalagem, caixas e unidades, com status de cada divergência.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  const [xml, setXml] = useState<File | null>(null);
  const [pdf, setPdf] = useState<File | null>(null);
  const [nota, setNota] = useState<NotaFiscal | null>(null);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [erroXml, setErroXml] = useState<string | null>(null);
  const [erroPdf, setErroPdf] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [historico, setHistorico] = useState<Conferencia[]>([]);
  const [aba, setAba] = useState("conferencia");
  const leituraXml = useRef(0);
  const leituraPdf = useRef(0);

  useEffect(() => {
    setHistorico(listarHistorico());
  }, []);

  async function receberXml(file: File | null) {
    const leitura = ++leituraXml.current;
    setResultado(null);
    setErroXml(null);
    setXml(file);
    setNota(null);
    if (!file) return;
    try {
      const texto = await file.text();
      if (leitura === leituraXml.current) setNota(parseNotaXml(texto));
    } catch (e) {
      if (leitura === leituraXml.current) setErroXml(e instanceof Error ? e.message : "Não foi possível ler o XML.");
    }
  }

  async function receberPdf(file: File | null) {
    const leitura = ++leituraPdf.current;
    setResultado(null);
    setErroPdf(null);
    setPdf(file);
    setPedido(null);
    if (!file) {
      setProcessando(false);
      return;
    }
    try {
      setProcessando(true);
      const lido = await lerPedidoPdf(file);
      if (leitura === leituraPdf.current) setPedido(lido);
    } catch (e) {
      if (leitura === leituraPdf.current) setErroPdf(e instanceof Error ? e.message : "Não foi possível ler o PDF do pedido.");
    } finally {
      if (leitura === leituraPdf.current) setProcessando(false);
    }
  }

  function executar() {
    if (!nota || !pedido) return;
    const res = conciliar(nota, pedido);
    setResultado(res);
    salvarConferencia({ nota, pedido, resultado: res });
    setHistorico(listarHistorico());
    toast.success(
      res.divergentes
        ? `${res.divergentes} divergência(s) encontrada(s) em ${res.totalItens} itens.`
        : `Nota conferida: ${res.totalItens} itens conformes.`,
    );
  }

  function abrirDoHistorico(c: Conferencia) {
    ++leituraXml.current;
    ++leituraPdf.current;
    setProcessando(false);
    setErroXml(null);
    setErroPdf(null);
    setNota(c.nota);
    setPedido(c.pedido);
    setResultado(c.resultado);
    setXml(null);
    setPdf(null);
    setAba("conferencia");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-primary/10 to-transparent" />

      <header className="relative border-b bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4">
          <Logo />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight">Conciliador Fiscal</h1>
            <p className="truncate text-xs text-muted-foreground">
              Nota fiscal × pedido de compras por EAN e DUN
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl space-y-6 px-4 py-6">
        <Tabs value={aba} onValueChange={(valor) => { setAba(valor); if (valor === "historico") setHistorico(listarHistorico()); }}>
          <TabsList>
            <TabsTrigger value="conferencia">
              <ScanSearch className="mr-2 size-4" />
              Conferência
            </TabsTrigger>
            <TabsTrigger value="historico">
              <History className="mr-2 size-4" />
              Histórico (7 dias)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conferencia" className="mt-5 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <DropZoneArquivo
                titulo="XML da nota fiscal"
                descricao="Arquivo .xml da NF-e do fornecedor"
                accept=".xml,text/xml,application/xml"
                icone={<FileCode2 className="size-5" />}
                arquivo={xml}
                erro={erroXml}
                onArquivo={receberXml}
                resumo={
                  nota ? (
                    <p className="text-xs text-muted-foreground">
                      NF {nota.numero}
                      {nota.serie ? `/${nota.serie}` : ""} · {nota.emitente} · {nota.itens.length}{" "}
                      itens
                    </p>
                  ) : null
                }
              />
              <DropZoneArquivo
                titulo="PDF do pedido de compras"
                descricao="Pedido completo (modelo Concinco)"
                accept=".pdf,application/pdf"
                icone={<FileText className="size-5" />}
                arquivo={pdf}
                erro={erroPdf}
                onArquivo={receberPdf}
                resumo={
                  pedido ? (
                    <p className="text-xs text-muted-foreground">
                      Pedido {pedido.numero || "—"} · {pedido.fornecedor || "Fornecedor"} ·{" "}
                      {pedido.itens.length} itens
                    </p>
                  ) : null
                }
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={executar}
                disabled={!nota || !pedido || processando}
                className="shadow-lg shadow-primary/20"
              >
                {processando ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Lendo arquivos…
                  </>
                ) : (
                  <>
                    <ScanSearch className="mr-2 size-4" />
                    Conciliar
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                O cruzamento usa o EAN; quando a nota traz DUN e EAN, o DUN fica como apoio.
              </p>
            </div>

            {resultado && nota ? (
              <div className="space-y-5">
                <CartoesResumo resultado={resultado} valorNota={nota.valorTotal} />
                <TabelaItens itens={resultado.itens} nota={nota} pedido={pedido} />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed bg-card p-10 text-center">
                <ScanSearch className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">Envie os dois arquivos para conferir</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Comparamos embalagem, caixas e unidades item por item.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="historico" className="mt-5">
            <ListaHistorico
              itens={historico}
              onAbrir={abrirDoHistorico}
              onRemover={(id) => setHistorico(removerConferencia(id))}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
