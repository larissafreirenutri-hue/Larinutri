import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sair } from "@/app/login/actions";
import { BarraLateral } from "./barra-lateral";

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
        className="w-full rounded-md border border-dourado/40 px-4 py-2 font-sans text-sm text-dourado transition hover:bg-dourado/10"
      >
        Sair
      </button>
    </form>
  );

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <BarraLateral email={user.email ?? ""} botaoSair={botaoSair} />

      <main className="min-w-0 flex-1 px-6 py-10 md:px-10">
        <div className="mx-auto w-full max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
