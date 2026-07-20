import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatarMoeda } from "@/lib/formato";
import { agora } from "@/lib/visao-geral";
import {
  chaveMes,
  diaDeHoje,
  marcarAtrasados,
  resumirFinanceiro,
  type Lancamento,
} from "@/lib/financeiro";
import { CabecalhoArea } from "../cabecalho-area";
import { Kpi } from "../pacientes/indicadores";
import { GraficoReceita } from "./grafico-receita";
import { NovoLancamento } from "./formulario-lancamento";
import { Lista } from "./lista";

export const metadata: Metadata = {
  title: "Financeiro, Larissa Freire Nutricionista",
};

export default async function FinanceiroPage() {
  const supabase = await createClient();
  const momento = agora();

  // O RLS limita as duas consultas às linhas desta nutricionista.
  const [lancamentosRes, pacientesRes] = await Promise.all([
    supabase
      .from("transactions")
      .select("*, patients(id, full_name)")
      .order("created_at", { ascending: false }),
    supabase.from("patients").select("id, full_name").order("full_name"),
  ]);

  const erro = lancamentosRes.error ?? pacientesRes.error;
  const lancamentos = (lancamentosRes.data ?? []) as unknown as Lancamento[];
  const pacientes = (pacientesRes.data ?? []) as {
    id: string;
    full_name: string;
  }[];

  const resumo = resumirFinanceiro(lancamentos, momento);
  const comAtraso = marcarAtrasados(lancamentos, momento);
  const positivo = resumo.resultado >= 0;

  return (
    <>
      <CabecalhoArea
        titulo="Financeiro"
        apoio="O que entrou, o que saiu e o que ainda falta receber."
      />

      {erro ? (
        <p
          role="alert"
          className="mt-8 rounded-md border border-argila/35 bg-argila-suave px-4 py-3 font-sans text-sm text-argila"
        >
          Não foi possível carregar os lançamentos. {erro.message}
        </p>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Kpi
          rotulo="Recebido no mês"
          valor={formatarMoeda(resumo.receitaRecebida) ?? "R$ 0,00"}
          rodape="receitas pagas"
          destaque="text-emerald-700"
        />
        <Kpi
          rotulo="A receber"
          valor={formatarMoeda(resumo.aReceber) ?? "R$ 0,00"}
          rodape="receitas pendentes"
        />
        <Kpi
          rotulo="Atrasado"
          valor={formatarMoeda(resumo.atrasado) ?? "R$ 0,00"}
          rodape={
            resumo.atrasadosQtd === 0
              ? "nada vencido"
              : `${resumo.atrasadosQtd} ${
                  resumo.atrasadosQtd === 1 ? "cobrança" : "cobranças"
                }`
          }
          destaque={resumo.atrasado > 0 ? "text-argila" : undefined}
        />
        <Kpi
          rotulo="Despesas do mês"
          valor={formatarMoeda(resumo.despesasPagas) ?? "R$ 0,00"}
          rodape="despesas pagas"
          destaque="text-mel-tinta"
        />
        <Kpi
          rotulo="Resultado do mês"
          valor={formatarMoeda(resumo.resultado) ?? "R$ 0,00"}
          rodape="recebido menos despesas"
          destaque={positivo ? "text-emerald-700" : "text-argila"}
        />
      </section>

      <NovoLancamento pacientes={pacientes} hoje={diaDeHoje(momento)} />

      {lancamentos.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-linha px-6 py-14 text-center">
          <p className="font-display text-xl text-neutro">
            Nenhum lançamento ainda
          </p>
          <p className="mx-auto mt-3 max-w-sm font-sans text-sm leading-relaxed text-neutro">
            Registre a primeira consulta recebida ou uma despesa do consultório.
            Os indicadores acima passam a fazer sentido a partir daí.
          </p>
        </div>
      ) : (
        <>
          <section className="mt-8">
            <GraficoReceita meses={resumo.porMes} />
          </section>

          <section className="mt-10">
            <h2 className="font-display text-xl text-vital-fundo">Lançamentos</h2>
            <Lista
              lancamentos={comAtraso}
              pacientes={pacientes}
              hoje={diaDeHoje(momento)}
              mesAtual={chaveMes(momento)}
              agora={momento}
              atrasadosQtd={resumo.atrasadosQtd}
            />
          </section>
        </>
      )}
    </>
  );
}
