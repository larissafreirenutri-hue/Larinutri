import type { Metadata } from "next";
import { CabecalhoArea, EmConstrucao } from "../cabecalho-area";

export const metadata: Metadata = {
  title: "Triagem, Larissa Freire Nutricionista",
};

export default function TriagemPage() {
  return (
    <>
      <CabecalhoArea titulo="Triagem" />
      <EmConstrucao oQueVem="Esta tela entra numa das próximas etapas deste arco, seguindo as referências." />
    </>
  );
}
