import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileCheck2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSessao } from "@/hooks/useSessao";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar | Conciliador NF-e x Pedido" },
      {
        name: "description",
        content:
          "Acesse o conciliador para comparar o XML da nota fiscal com o pedido de compras.",
      },
      { property: "og:title", content: "Entrar | Conciliador NF-e x Pedido" },
      {
        property: "og:description",
        content: "Acesse o conciliador de nota fiscal e pedido de compras.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useSessao();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (user) void navigate({ to: "/" });
  }, [user, navigate]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setOcupado(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        void navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Conta criada. Confirme o e-mail se for solicitado e entre.");
        setModo("entrar");
      }
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível continuar.");
    } finally {
      setOcupado(false);
    }
  };

  const entrarGoogle = async () => {
    setOcupado(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setOcupado(false);
      toast.error("Não foi possível entrar com o Google.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/" });
  };

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="hidden flex-col justify-between border-r bg-sidebar p-10 lg:flex">
        <div className="flex items-center gap-2 text-sidebar-foreground">
          <FileCheck2 className="size-5 text-primary" />
          <span className="font-semibold tracking-tight">Conciliador NF-e x Pedido</span>
        </div>
        <div className="max-w-sm space-y-4">
          <h1 className="text-3xl leading-tight font-semibold text-sidebar-foreground">
            Confira nota e pedido em segundos.
          </h1>
          <p className="text-sm text-muted-foreground">
            Cruzamento automático por EAN e DUN, com embalagem, caixas e unidades lado a lado. O
            histórico dos últimos 7 dias fica salvo na sua conta.
          </p>
        </div>
        <p className="font-mono text-xs text-muted-foreground">EAN · DUN · EMB · CX · UN</p>
      </div>

      <div className="flex flex-col items-center justify-center p-6">
        <div className="mb-6 flex w-full max-w-sm items-center justify-between lg:justify-end">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground lg:hidden">
            Voltar
          </Link>
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-card-foreground">
            {modo === "entrar" ? "Entrar" : "Criar conta"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use seu e-mail de trabalho para guardar o histórico das conferências.
          </p>

          <form onSubmit={enviar} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete={modo === "entrar" ? "current-password" : "new-password"}
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={ocupado}>
              {ocupado && <Loader2 className="mr-2 size-4 animate-spin" />}
              {modo === "entrar" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button variant="outline" className="w-full" onClick={entrarGoogle} disabled={ocupado}>
            Continuar com Google
          </Button>

          <button
            type="button"
            className="mt-5 w-full text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
          >
            {modo === "entrar" ? "Não tem conta? Criar agora" : "Já tenho conta. Entrar"}
          </button>
        </div>
      </div>
    </main>
  );
}
