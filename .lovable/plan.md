# Concluir o conciliador, sem login e com visual novo

Terminar o sistema usando o que já existe (leitura do XML da nota, leitura do PDF do pedido e a regra de cruzamento por EAN/DUN) e entregar a tela pronta, bonita e sem exigir cadastro.

## Sem login

- A entrada de e-mail/senha sai do caminho: a tela de conferência abre direto ao entrar no site.
- O histórico dos últimos 7 dias passa a ficar guardado no próprio navegador do usuário (some se ele limpar os dados do navegador ou trocar de aparelho), já que sem conta não há como separar os dados de cada pessoa com segurança.

## Tela principal

1. Topo com logo de conciliação (duas setas/documentos se encontrando, desenhada em código, nítida nos dois temas), nome do sistema e o botão claro/escuro.
2. Duas áreas de envio lado a lado, com arrastar-e-soltar: **XML da nota** e **PDF do pedido**. Cada área mostra o nome do arquivo lido e um resumo (nota/série/fornecedor; número do pedido/fornecedor).
3. Botão "Conciliar" ativo somente com os dois arquivos; enquanto processa, mostra carregamento.
4. Cartões de resumo: total de itens, conformes, divergentes, valor da nota — com barra de conformidade.
5. Tabela de itens: sequência, descrição (nota e pedido), EAN, DUN, embalagem nota × pedido, caixas nota × pedido, unidades nota × pedido, diferenças e status colorido (verde / âmbar / vermelho).
6. Filtros rápidos por status e busca por EAN ou descrição; contagem por status em abas.
7. Botão para exportar o resultado em CSV.

## Histórico (7 dias)

- Aba "Histórico" com as conferências dos últimos 7 dias: nota, fornecedor, pedido, data e nº de divergências.
- Clicar reabre a conferência completa (itens e resumo). Opção de apagar um registro.
- Registros com mais de 7 dias são descartados automaticamente.

## Visual

- Estilo moderno de painel fiscal: cartões com leve profundidade, gradiente discreto no topo, tipografia IBM Plex Sans com números em JetBrains Mono, transições suaves e estados de foco visíveis.
- Claro/escuro com preferência lembrada, aplicado por tokens do tema (nada de cor fixa).
- Responsivo: no celular os cartões empilham e a tabela vira lista de fichas legíveis.

## Detalhes técnicos

- `src/routes/index.tsx` passa a ser a tela única com abas Conferência/Histórico; `src/routes/auth.tsx` é removida junto com `useSessao`.
- Novos componentes: `Logo`, `DropZoneArquivo`, `CartoesResumo`, `TabelaItens`, `ListaHistorico`.
- Persistência local em `src/lib/historico.ts` (localStorage, chave versionada, poda por `salvoEm >= agora - 7 dias`), gravando a conciliação completa (cabeçalhos + itens) para reabrir.
- Leitura do XML no cliente (`parseNotaXml`) e do PDF no cliente (`lerPedidoPdf`, pdfjs com worker por URL, import dinâmico).
- `head()` da rota inicial com título/descrição próprios do conciliador.
- As tabelas do banco criadas antes ficam sem uso nesta versão (não serão removidas), podendo voltar se o login for reativado no futuro.
