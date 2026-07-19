import { Cabecalho } from "./cabecalho";
import { Rodape } from "./rodape";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Cabecalho />
      <div className="flex-1">{children}</div>
      <Rodape />
    </>
  );
}
