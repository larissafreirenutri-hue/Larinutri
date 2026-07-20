import type { Metadata } from "next";
import { CabecalhoArea, EmConstrucao } from "../cabecalho-area";

export const metadata: Metadata = {
  title: "Área de trabalho, Larissa Freire Nutricionista",
};

export default function TrabalhoPage() {
  return (
    <>
      <CabecalhoArea
        titulo="Área de trabalho"
        apoio="O seu dia a dia, tarefas e agenda."
      />
      <EmConstrucao oQueVem="Esta área vai concentrar as tarefas pendentes, os retornos a fazer e a agenda de atendimentos da semana." />
    </>
  );
}
