import { test } from "node:test";
import assert from "node:assert/strict";
import { conciliar } from "./conciliacao";
import type { NotaFiscal } from "./nfe";
import type { Pedido } from "./pedido";

test("prioriza EAN sobre DUN e compara caixas e unidades", () => {
  const nota: NotaFiscal = { numero: "1", serie: "1", chave: "", emitente: "Teste", cnpj: "", emissao: null, valorTotal: 267.3, itens: [
    { seq: 1, codigo: "1", descricao: "Creme", ean: "7896013568520", dun: "17896013568527", embalagem: "CX", qtdComercial: 3, unidadeTrib: "UN", qtdTributavel: 18, valorTotal: 267.3 },
  ] };
  const pedido: Pedido = { numero: "247678/L", fornecedor: "Teste", cnpj: "", emissao: null, valorTotal: 267.3, itens: [
    { seq: "1", descricao: "Creme", ean: "7896013568520", embalagem: "CX 6", embalagemFator: 6, quantidade: 3, valorUnitario: 89.1 },
    { seq: "2", descricao: "Outro", ean: "17896013568527", embalagem: "CX 12", embalagemFator: 12, quantidade: 9, valorUnitario: 1 },
  ] };
  const resultado = conciliar(nota, pedido);
  assert.equal(resultado.itens[0]?.situacao, "conforme");
  assert.deepEqual([resultado.itens[0]?.caixasNota, resultado.itens[0]?.caixasPedido, resultado.itens[0]?.unidadesNota, resultado.itens[0]?.unidadesPedido], [3, 3, 18, 18]);
  assert.equal(resultado.itens[1]?.situacao, "so_no_pedido");
});

test("preenche os valores do detalhe do item (unitário e total, nota e pedido)", () => {
  const nota: NotaFiscal = { numero: "1", serie: "1", chave: "", emitente: "Teste", cnpj: "", emissao: null, valorTotal: 267.3, itens: [
    { seq: 1, codigo: "16151", descricao: "Creme", ean: "7896013568520", dun: null, embalagem: "CX", qtdComercial: 3, unidadeTrib: "UN", qtdTributavel: 18, valorTotal: 267.3 },
  ] };
  const pedido: Pedido = { numero: "247678/L", fornecedor: "Teste", cnpj: "", emissao: null, valorTotal: 267.3, itens: [
    { seq: "354031", descricao: "Creme", ean: "7896013568520", embalagem: "CX 6", embalagemFator: 6, quantidade: 3, valorUnitario: 89.1 },
  ] };
  const item = conciliar(nota, pedido).itens[0];
  assert.equal(item?.valorUnitarioNota, 14.85);
  assert.equal(item?.valorTotalNota, 267.3);
  assert.equal(item?.valorUnitarioPedido, 89.1);
  assert.equal(item?.valorTotalPedido, 267.3);
  assert.equal(item?.seqPedido, "354031");
  assert.equal(item?.codigoNota, "16151");
});
const base = { numero: "1", serie: "1", chave: "", emitente: "T", cnpj: "", emissao: null, valorTotal: 0 };
const ped = { numero: "1", fornecedor: "T", cnpj: "", emissao: null, valorTotal: 0 };

test("concilia quando o pedido tem mais de um código de barras", () => {
  const r = conciliar(
    { ...base, itens: [{ seq: 1, codigo: "9", descricao: "X", ean: "7890000000017", dun: null, embalagem: "UN", qtdComercial: 2, unidadeTrib: "UN", qtdTributavel: 2, valorTotal: 2 }] },
    { ...ped, itens: [{ seq: "1", descricao: "Y", ean: "7890000000024", gtins: ["7890000000024", "7890000000017"], embalagem: "UN", embalagemFator: 1, quantidade: 2, valorUnitario: 1 }] },
  );
  assert.equal(r.itens[0]?.criterio, "codigo_barras");
  assert.equal(r.itens[0]?.situacao, "conforme");
});

test("concilia pela referência e pela descrição quando o código de barras não bate", () => {
  const r = conciliar(
    { ...base, itens: [
      { seq: 1, codigo: "6852", descricao: "Outro nome", ean: null, dun: null, embalagem: "UN", qtdComercial: 1, unidadeTrib: "UN", qtdTributavel: 1, valorTotal: 1 },
      { seq: 2, codigo: "1", descricao: "SHAMPOO VITAY NOVEX 300ML", ean: null, dun: null, embalagem: "UN", qtdComercial: 1, unidadeTrib: "UN", qtdTributavel: 1, valorTotal: 1 },
    ] },
    { ...ped, itens: [
      { seq: "10", descricao: "CREME NOVEX 1KG 6852", ean: "7896013568520", embalagem: "UN", embalagemFator: 1, quantidade: 1, valorUnitario: 1 },
      { seq: "11", descricao: "SHAMPOO NOVEX VITAY 300ML", ean: "7896013569817", embalagem: "UN", embalagemFator: 1, quantidade: 1, valorUnitario: 1 },
    ] },
  );
  assert.deepEqual(r.itens.map((i) => [i.criterio, i.seqPedido]), [["referencia", "10"], ["descricao", "11"]]);
});
