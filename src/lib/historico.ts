import type { NotaFiscal } from "./nfe";
import type { Pedido } from "./pedido";
import { conciliar, type Resultado } from "./conciliacao";

export type Conferencia = {
  id: string;
  salvoEm: string;
  nota: NotaFiscal;
  pedido: Pedido;
  resultado: Resultado;
};

const CHAVE = "conciliacoes.v1";
const SETE_DIAS = 7 * 24 * 60 * 60 * 1000;

function disponivel() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function listarHistorico(): Conferencia[] {
  if (!disponivel()) return [];
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) return [];
    const lista = JSON.parse(bruto) as Conferencia[];
    const limite = Date.now() - SETE_DIAS;
    const validas = lista
      .filter((c) => c && new Date(c.salvoEm).getTime() >= limite)
      .map((c) => ({ ...c, resultado: conciliar(c.nota, c.pedido) }))
      .sort((a, b) => (a.salvoEm < b.salvoEm ? 1 : -1));
    if (validas.length !== lista.length) gravar(validas);
    return validas;
  } catch {
    return [];
  }
}

function gravar(lista: Conferencia[]) {
  if (!disponivel()) return;
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(lista.slice(0, 60)));
  } catch {
    /* espaço cheio: ignora */
  }
}

export function salvarConferencia(
  dados: Omit<Conferencia, "id" | "salvoEm">,
): Conferencia {
  const registro: Conferencia = {
    ...dados,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    salvoEm: new Date().toISOString(),
  };
  gravar([registro, ...listarHistorico()]);
  return registro;
}

export function removerConferencia(id: string): Conferencia[] {
  const restante = listarHistorico().filter((c) => c.id !== id);
  gravar(restante);
  return restante;
}

export function limparHistorico() {
  gravar([]);
}
