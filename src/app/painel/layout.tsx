import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sair } from "@/app/login/actions";
import { Navegacao } from "./navegacao";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // O proxy já barra visitantes. Esta é a segunda camada, e vale para
  // todas as telas do painel de uma vez só.
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-creme">Bem-vinda</h1>
          <p className="mt-2 font-sans text-sm text-creme/60">{user.email}</p>
        </div>

        <form action={sair}>
          <button
            type="submit"
            className="rounded-md border border-dourado/40 px-4 py-2 font-sans text-sm text-dourado transition hover:bg-dourado/10"
          >
            Sair
          </button>
        </form>
      </header>

      <Navegacao />

      {children}
    </div>
  );
}
