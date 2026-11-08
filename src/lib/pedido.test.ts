import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePedidoTexto } from "./pedido";

const texto = `PEDIDO DE COMPRAS 247678 / L
R. Social DOARBELLEZA PRODUTOS DE BELEZA- FILIAL R. Social CIRNE IRMAOS & CIA LTDA CD
280336 CREME NOVEX CX 6 3,00 0,00 89,1000 267,30
1KG INF COLAG
6852
EANs: 7896013568520
280333 SHAMPOO+CON CX 12 2,00 0,00 129,1200 258,24
D VITAYNOVEX
DR RICINO 6981
EANs: 7896013569817
Valor total do pedido 525,54
Data da emissão 03/09/2026`;

test("lê embalagem e quantidade antes do EAN no pedido Concinco", () => {
  const pedido = parsePedidoTexto(texto);
  assert.equal(pedido.numero, "247678/L");
  assert.deepEqual(pedido.itens.map((i) => [i.ean, i.embalagem, i.quantidade, i.valorUnitario]), [
    ["7896013568520", "CX 6", 3, 89.1],
    ["7896013569817", "CX 12", 2, 129.12],
  ]);
  assert.equal(pedido.itens[0]?.descricao, "CREME NOVEX 1KG INF COLAG 6852");
  assert.equal(pedido.fornecedor, "DOARBELLEZA PRODUTOS DE BELEZA- FILIAL");
  assert.equal(pedido.valorTotal, 525.54);
});

test("não aceita EAN sem linha de quantidade reconhecida", () => {
  assert.throws(() => parsePedidoTexto("EANs: 7896013568520"));
});