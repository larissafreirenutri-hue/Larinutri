import { sairPaciente } from "../entrar/actions";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-papel text-tinta">
      <header className="bg-marrom text-creme">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 py-4">
          <div className="leading-none">
            <span className="block font-display text-[18px] text-creme">
              Larissa Freire
            </span>
            <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.22em] text-dourado">
              Seu acompanhamento
            </span>
          </div>
          <form action={sairPaciente}>
            <button
              type="submit"
              className="rounded-full border border-dourado/40 px-4 py-1.5 font-sans text-[13px] text-dourado transition hover:bg-dourado/10"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-6">
        {children}
      </main>
    </div>
  );
}
