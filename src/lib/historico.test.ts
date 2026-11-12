import { test } from "node:test";
import assert from "node:assert/strict";
import { listarHistorico } from "./historico";

test("histórico mantém apenas os últimos 7 dias, incluindo o limite", () => {
  const agora = Date.now();
  const seteDias = 7 * 24 * 60 * 60 * 1000;
  const documentos = {
    nota: { numero: "1", serie: "1", chave: "", emitente: "Teste", cnpj: "", emissao: null, valorTotal: 0, itens: [] },
    pedido: { numero: "1", fornecedor: "Teste", cnpj: "", emissao: null, valorTotal: 0, itens: [] },
    resultado: { itens: [], totalItens: 0, conformes: 0, divergentes: 0 },
  };
  let valor = JSON.stringify([
    { ...documentos, id: "recente", salvoEm: new Date(agora).toISOString() },
    { ...documentos, id: "limite", salvoEm: new Date(agora - seteDias).toISOString() },
    { ...documentos, id: "antigo", salvoEm: new Date(agora - seteDias - 1).toISOString() },
  ]);
  const anterior = Object.getOwnPropertyDescriptor(globalThis, "window");
  const now = Date.now;
  try {
    Date.now = () => agora;
    Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: {
      getItem: () => valor, setItem: (_: string, v: string) => { valor = v; },
    } } });
    assert.deepEqual(listarHistorico().map((c) => c.id), ["recente", "limite"]);
    assert.equal(JSON.parse(valor).length, 2);
  } finally {
    Date.now = now;
    if (anterior) Object.defineProperty(globalThis, "window", anterior);
    else Reflect.deleteProperty(globalThis, "window");
  }
});