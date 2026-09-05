CREATE TABLE public.conciliacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  nf_numero text,
  nf_serie text,
  nf_chave text,
  nf_emitente text,
  nf_cnpj text,
  nf_emissao date,
  nf_valor_total numeric(14,2),
  pedido_numero text,
  pedido_fornecedor text,
  pedido_emissao date,
  total_itens integer NOT NULL DEFAULT 0,
  itens_conformes integer NOT NULL DEFAULT 0,
  itens_divergentes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.conciliacao_itens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conciliacao_id uuid NOT NULL REFERENCES public.conciliacoes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  ean text,
  dun text,
  descricao_nota text,
  descricao_pedido text,
  embalagem_nota text,
  embalagem_pedido text,
  caixas_nota numeric(14,3),
  caixas_pedido numeric(14,3),
  unidades_nota numeric(14,3),
  unidades_pedido numeric(14,3),
  dif_caixas numeric(14,3),
  dif_unidades numeric(14,3),
  situacao text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX conciliacoes_user_created_idx ON public.conciliacoes (user_id, created_at DESC);
CREATE INDEX conciliacao_itens_conc_idx ON public.conciliacao_itens (conciliacao_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conciliacoes TO authenticated;
GRANT ALL ON public.conciliacoes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conciliacao_itens TO authenticated;
GRANT ALL ON public.conciliacao_itens TO service_role;

ALTER TABLE public.conciliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conciliacao_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own conciliacoes" ON public.conciliacoes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own conciliacao itens" ON public.conciliacao_itens FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);