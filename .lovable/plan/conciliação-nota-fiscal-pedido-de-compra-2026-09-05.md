# Conciliação Nota Fiscal × Pedido de Compra

Sistema que compara automaticamente o XML da nota fiscal com o PDF do pedido de compra da Concinco, cruzando EAN/DUN, descrição, embalagem e quantidades.

## Como vai funcionar

1. Tela única de conferência: você envia o **XML da nota** e o **PDF do pedido**.
2. O sistema lê os itens dos dois arquivos: código EAN (e DUN quando vier junto), descrição, embalagem (ex.: CX 6) e quantidade.
3. O cruzamento é feito pelo EAN. Quando a nota traz DUN e EAN juntos, o EAN é usado para casar com o pedido, e o DUN fica visível como informação de apoio.
4. Resultado em tabela com um status por item:
   - Conforme (quantidade e embalagem batem)
   - Quantidade divergente
   - Embalagem divergente
   - Item só na nota (não pedido)
   - Item só no pedido (não faturado)
5. Quantidades mostradas **nas duas bases**: em caixas (pedido 3 CX) e em unidades (3 × 6 = 18), com divergência apontada em ambas.
6. Resumo no topo: total de itens, conformes, divergentes, valor da nota.

## Histórico

- Cada conferência é salva na nuvem (banco de dados do Lovable Cloud).
- A tela de histórico mostra **apenas os últimos 7 dias**, com nota, fornecedor, número do pedido, data e quantidade de divergências; é possível reabrir uma conferência para ver o detalhe dos itens.

## Layout

- Visual moderno, tabela densa e legível, própria de sistema de conferência fiscal.
- Botão de alternância **claro / escuro**, com a preferência lembrada.
- Status por cor (verde/âmbar/vermelho) usando tokens do tema, funcionando nos dois modos.

## Detalhes técnicos

- Leitura do XML (NF-e) no navegador: `det/prod` → `cEAN`, `cEANTrib`, `xProd`, `uCom`, `qCom`, `uTrib`, `qTrib`; a embalagem vem de `uCom` e o fator unidade/caixa de `qTrib/qCom`.
- Leitura do PDF do pedido feita em server function (`createServerFn`) com `pdfjs-dist` extraindo texto por linha: sequência, descrição, `EANs: <código>`, coluna `Emb` (`CX 6`) e `Qtde`. Cabeçalho do pedido (número, fornecedor, CNPJ, datas) também extraído.
- Casamento: chave primária EAN normalizado (sem zeros à esquerda); fallback por DUN quando o pedido usa DUN; itens sem par entram como exclusivos de cada lado.
- Lovable Cloud (banco) com tabelas `reconciliations` e `reconciliation_items`, RLS por usuário autenticado + grants; consulta de histórico filtrada por `created_at >= now() - interval '7 days'`.
- Login simples por e-mail para vincular o histórico ao usuário.

## Fora do escopo

- Envio de e-mail, integração direta com o ERP e aprovação/bloqueio de recebimento.
