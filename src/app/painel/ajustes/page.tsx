import type { Metadata } from "next";
import { CabecalhoArea, EmConstrucao } from "../cabecalho-area";

export const metadata: Metadata = {
  title: "Ajustes, Larissa Freire Nutricionista",
};

export default function AjustesPage() {
  return (
    <>
      <CabecalhoArea titulo="Ajustes" />
      <EmConstrucao oQueVem="Esta tela entra numa das próximas etapas deste arco, seguindo as referências." />
    </>
  );
}
