import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sair } from "@/app/login/actions";
import { BarraTopo } from "./barra-topo";

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
  // todas as telas da área autenticada de uma vez só.
  if (!user) {
    redirect("/login");
  }

  const botaoSair = (
    <form action={sair}>
      <button
        type="submit"
        title={user.email ?? undefined}
        className="rounded-full border border-sobre-escuro/25 px-4 py-1.5 font-sans text-xs text-sobre-escuro/80 transition hover:border-sobre-escuro/50 hover:text-sobre-escuro-forte"
      >
        Sair
      </button>
    </form>
  );

  return (
    <div className="flex flex-1 flex-col">
      <BarraTopo botaoSair={botaoSair} />

      <main className="min-w-0 flex-1 px-5 py-10">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
