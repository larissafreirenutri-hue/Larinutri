import type { Metadata } from "next";
import { CabecalhoArea, EmConstrucao } from "../cabecalho-area";

export const metadata: Metadata = {
  title: "Esteira, Larissa Freire Nutricionista",
};

export default function EsteiraPage() {
  return (
    <>
      <CabecalhoArea titulo="Esteira" />
      <EmConstrucao oQueVem="Esta tela entra numa das próximas etapas deste arco, seguindo as referências." />
    </>
  );
}
