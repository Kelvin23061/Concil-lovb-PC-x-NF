import { expect, test } from "bun:test";
import { listarHistorico } from "./historico";

test("histórico mantém apenas os últimos 7 dias, incluindo o limite", () => {
  const agora = Date.now();
  const seteDias = 7 * 24 * 60 * 60 * 1000;
  let valor = JSON.stringify([
    { id: "recente", salvoEm: new Date(agora).toISOString() },
    { id: "limite", salvoEm: new Date(agora - seteDias).toISOString() },
    { id: "antigo", salvoEm: new Date(agora - seteDias - 1).toISOString() },
  ]);
  const anterior = Object.getOwnPropertyDescriptor(globalThis, "window");
  const now = Date.now;
  try {
    Date.now = () => agora;
    Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: {
      getItem: () => valor, setItem: (_: string, v: string) => { valor = v; },
    } } });
    expect(listarHistorico().map((c) => c.id)).toEqual(["recente", "limite"]);
    expect(JSON.parse(valor).length).toBe(2);
  } finally {
    Date.now = now;
    if (anterior) Object.defineProperty(globalThis, "window", anterior);
    else Reflect.deleteProperty(globalThis, "window");
  }
});