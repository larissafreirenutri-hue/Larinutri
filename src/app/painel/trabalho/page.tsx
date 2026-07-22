import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { agora } from "@/lib/visao-geral";
import {
  diaDeHoje,
  marcarRotinasVencidas,
  resumirTrabalho,
  type Rotina,
  type Tarefa,
} from "@/lib/trabalho";
import { CabecalhoArea } from "../cabecalho-area";
import { Kpi } from "../pacientes/indicadores";
import { Agenda } from "./agenda";
import { Rotinas } from "./rotinas";

export const metadata: Metadata = {
  title: "Área de trabalho, Larissa Freire Nutricionista",
};

export default async function TrabalhoPage() {
  const supabase = await createClient();
  const momento = agora();

  const hoje = diaDeHoje(momento);

  // O RLS limita as consultas às linhas desta nutricionista.
  const [tarefasRes, rotinasRes, pacientesRes, planosRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, patients(id, full_name)")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("routines")
      .select("*")
      .order("next_due", { ascending: true, nullsFirst: false }),
    supabase.from("patients").select("id, full_name").order("full_name"),
    supabase
      .from("patients")
      .select("id, full_name, plano_vence")
      .not("plano_vence", "is", null)
      .order("plano_vence"),
  ]);

  const erro =
    tarefasRes.error ?? rotinasRes.error ?? pacientesRes.error ?? planosRes.error;

  const tarefas = (tarefasRes.data ?? []) as unknown as Tarefa[];
  const rotinas = (rotinasRes.data ?? []) as Rotina[];
  const pacientes = (pacientesRes.data ?? []) as {
    id: string;
    full_name: string;
  }[];

  const planos = (planosRes.data ?? []) as {
    id: string;
    full_name: string;
    plano_vence: string;
  }[];

  const resumo = resumirTrabalho(tarefas, rotinas, momento);

  return (
    <>
      <CabecalhoArea
        titulo="Área de trabalho"
        apoio="O que precisa da sua atenção hoje, e o que se repete toda semana."
      />

      {erro ? (
        <p
          role="alert"
          className="mt-8 rounded-md border border-red-300/40 bg-red-900/20 px-4 py-3 font-sans text-sm text-red-100"
        >
          Não foi possível carregar a área de trabalho. {erro.message}
        </p>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          rotulo="Tarefas pendentes"
          valor={resumo.pendentes}
          rodape="em aberto"
        />
        <Kpi
          rotulo="Atrasadas"
          valor={resumo.atrasadas}
          rodape={resumo.atrasadas === 0 ? "nada vencido" : "passaram do prazo"}
          destaque={resumo.atrasadas > 0 ? "text-red-200" : undefined}
        />
        <Kpi
          rotulo="Concluídas"
          valor={resumo.concluidasNaSemana}
          rodape="nos últimos 7 dias"
          destaque={
            resumo.concluidasNaSemana > 0 ? "text-emerald-200" : undefined
          }
        />
        <Kpi
          rotulo="Rotinas ativas"
          valor={resumo.rotinasAtivas}
          rodape="em andamento"
        />
      </section>

      <Agenda
        tarefas={tarefas}
        rotinas={rotinas.filter((r) => r.ativa)}
        planos={planos}
        pacientes={pacientes}
        hoje={hoje}
        agora={momento}
      />

      <Rotinas
        rotinas={marcarRotinasVencidas(rotinas, momento)}
        hoje={diaDeHoje(momento)}
      />
    </>
  );
}
