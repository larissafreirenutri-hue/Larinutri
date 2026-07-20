import { Cabecalho } from "./cabecalho";
import { Rodape } from "./rodape";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // O painel virou claro, então o site institucional precisa carregar
  // o próprio fundo escuro em vez de herdar o do body.
  return (
    <div className="flex min-h-full flex-1 flex-col bg-marrom text-creme">
      <Cabecalho />
      <div className="flex-1">{children}</div>
      <Rodape />
    </div>
  );
}
