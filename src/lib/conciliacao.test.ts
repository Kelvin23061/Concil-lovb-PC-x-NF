import { expect, test } from "bun:test";
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
  expect(resultado.itens[0]).toMatchObject({ situacao: "conforme", caixasNota: 3, caixasPedido: 3, unidadesNota: 18, unidadesPedido: 18 });
  expect(resultado.itens[1]?.situacao).toBe("so_no_pedido");
});