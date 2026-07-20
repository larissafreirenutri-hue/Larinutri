import type { Metadata } from "next";
import { CabecalhoArea, EmConstrucao } from "../cabecalho-area";

export const metadata: Metadata = {
  title: "Financeiro, Larissa Freire Nutricionista",
};

export default function FinanceiroPage() {
  return (
    <>
      <CabecalhoArea
        titulo="Financeiro"
        apoio="Recebimentos, pendências e o resultado do mês."
      />
      <EmConstrucao oQueVem="Esta área vai mostrar o que já entrou, o que está a receber e o fechamento de cada mês, com os lançamentos ligados aos pacientes." />
    </>
  );
}
