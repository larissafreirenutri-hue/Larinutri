import type { Metadata } from "next";
import { CabecalhoArea, EmConstrucao } from "../cabecalho-area";

export const metadata: Metadata = {
  title: "Vendas, Larissa Freire Nutricionista",
};

export default function VendasPage() {
  return (
    <>
      <CabecalhoArea
        titulo="Vendas"
        apoio="Pacotes, propostas e contratos de acompanhamento."
      />
      <EmConstrucao oQueVem="Esta área vai reunir os pacotes oferecidos, o acompanhamento das propostas enviadas e a conversão de interessados em pacientes." />
    </>
  );
}
