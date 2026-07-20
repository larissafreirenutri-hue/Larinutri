import type { Metadata } from "next";
import { CabecalhoArea, EmConstrucao } from "../cabecalho-area";

export const metadata: Metadata = {
  title: "Links, Larissa Freire Nutricionista",
};

export default function LinksPage() {
  return (
    <>
      <CabecalhoArea titulo="Links" />
      <EmConstrucao oQueVem="Esta tela entra numa das próximas etapas deste arco, seguindo as referências." />
    </>
  );
}
