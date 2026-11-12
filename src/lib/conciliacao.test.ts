import { test } from "node:test";
import assert from "node:assert/strict";
import { conciliar, diferencaValor } from "./conciliacao";
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
  assert.equal(item?.valorUnitarioNota, 89.1);
  assert.equal(item?.valorTotalNota, 267.3);
  assert.equal(item?.valorUnitarioPedido, 89.1);
  assert.equal(item?.valorTotalPedido, 267.3);
  assert.equal(item?.seqPedido, "354031");
  assert.equal(item?.codigoNota, "16151");
  assert.equal(item?.valoresDivergentes, false);
  assert.equal(item?.situacao, "conforme");
});
const base = { numero: "1", serie: "1", chave: "", emitente: "T", cnpj: "", emissao: null, valorTotal: 0 };
const ped = { numero: "1", fornecedor: "T", cnpj: "", emissao: null, valorTotal: 0 };

function compararValores(totalNota: number, qtdNota = 3, unitPedido = 89.1) {
  return conciliar(
    { ...base, itens: [{ seq: 1, codigo: "1", descricao: "Creme", ean: "7896013568520", dun: null, embalagem: "CX", qtdComercial: qtdNota, unidadeTrib: "UN", qtdTributavel: qtdNota * 6, valorTotal: totalNota }] },
    { ...ped, itens: [{ seq: "1", descricao: "Creme", ean: "7896013568520", embalagem: "CX 6", embalagemFator: 6, quantidade: 3, valorUnitario: unitPedido }] },
  );
}

test("sinaliza preço diferente com código, embalagem e quantidade iguais", () => {
  const r = compararValores(270);
  assert.equal(r.itens[0]?.situacao, "valor_divergente");
  assert.equal(r.itens[0]?.difValorUnitario, 0.9);
  assert.equal(r.itens[0]?.difValorTotal, 2.7);
  assert.equal(r.divergentes, 1);
  assert.equal(r.conformes, 0);
});

test("sinaliza um centavo de diferença no total", () => {
  const item = compararValores(267.31).itens[0];
  assert.equal(item?.difValorTotal, 0.01);
  assert.equal(item?.valoresDivergentes, true);
});

test("sinaliza valores mesmo quando a quantidade também diverge", () => {
  const item = compararValores(180, 2).itens[0];
  assert.equal(item?.situacao, "qtd_divergente");
  assert.equal(item?.valoresDivergentes, true);
  assert.equal(item?.difValorTotal, -87.3);
});

test("compara preços unitários com quatro casas e totais com centavos", () => {
  const item = compararValores(267.3003, 3, 89.1001).itens[0];
  assert.equal(item?.valorUnitarioPedido, 89.1001);
  assert.equal(item?.valorUnitarioNota, 89.1001);
  assert.equal(item?.situacao, "conforme");
  assert.equal(diferencaValor(267.31, 267.3), 0.01);
  assert.equal(diferencaValor(0.1 + 0.2, 0.3), 0);
});

test("compara nota em unidades com preço do pedido por caixa", () => {
  const r = conciliar(
    { ...base, itens: [{ seq: 1, codigo: "1", descricao: "Creme", ean: "7896013568520", dun: null, embalagem: "UN", qtdComercial: 18, unidadeTrib: "UN", qtdTributavel: 18, valorTotal: 267.3 }] },
    { ...ped, itens: [{ seq: "1", descricao: "Creme", ean: "7896013568520", embalagem: "CX 6", embalagemFator: 6, quantidade: 3, valorUnitario: 89.1 }] },
  );
  assert.equal(r.itens[0]?.valorUnitarioNota, 89.1);
  assert.equal(r.itens[0]?.difValorUnitario, 0);
  assert.equal(r.itens[0]?.valoresDivergentes, false);
});

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
