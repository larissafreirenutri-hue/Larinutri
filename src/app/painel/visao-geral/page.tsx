import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Paciente } from "@/lib/tipos";
import {
  agora,
  calcularAdesao,
  contarNovos,
  pacientesEmAtencao,
  saudacao,
  DIAS_ATENCAO,
  type AtividadePaciente,
} from "@/lib/visao-geral";
import {
  formatarData,
  formatarDataExtenso,
  formatarPeso,
} from "@/lib/formato";
import { Kpi, SeloAdesao } from "../pacientes/indicadores";

export const metadata: Metadata = {
  title: "Visão geral, Larissa Freire Nutricionista",
};

const DIA = 24 * 60 * 60 * 1000;

type CheckinRecente = {
  id: string;
  patient_id: string;
  created_at: string;
  peso_kg: number | null;
  patients: { full_name: string } | null;
};

export default async function VisaoGeralPage() {
  const supabase = await createClient();
  const momento = agora();
  const desde30 = new Date(momento - 30 * DIA).toISOString();
  const desde7 = new Date(momento - 7 * DIA).toISOString();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Cada consulta traz só o que precisa. O RLS limita tudo às linhas
  // desta nutricionista, inclusive na view, que usa security_invoker.
  const [pacientesRes, atividadeRes, contagem7Res, adesaoRes, recentesRes] =
    await Promise.all([
      supabase.from("patients").select("id, full_name, created_at"),
      supabase.from("patient_activity").select("*"),
      supabase
        .from("checkins")
        .select("id", { count: "exact", head: true })
        .gte("created_at", desde7),
      supabase
        .from("checkins")
        .select("adesao_plano, adesao_plano_texto")
        .gte("created_at", desde30),
      supabase
        .from("checkins")
        .select("id, patient_id, created_at, peso_kg, patients(full_name)")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const erro =
    pacientesRes.error ??
    atividadeRes.error ??
    contagem7Res.error ??
    adesaoRes.error ??
    recentesRes.error;

  const pacientes = (pacientesRes.data ?? []) as Pick<
    Paciente,
    "id" | "full_name" | "created_at"
  >[];
  const atividade = (atividadeRes.data ?? []) as AtividadePaciente[];
  const recentes = (recentesRes.data ?? []) as unknown as CheckinRecente[];

  const atencao = pacientesEmAtencao(pacientes, atividade, momento);
  const adesao = calcularAdesao(
    (adesaoRes.data ?? []).map(
      (l) => (l.adesao_plano ?? l.adesao_plano_texto) as number | string | null,
    ),
  );

  return (
    <>
      <header className="border-b border-linha pb-6">
        <h1 className="font-display text-3xl text-tinta">
          {saudacao(momento)}, Larissa
        </h1>
        <p className="mt-2 font-sans text-sm text-neutro">
          {formatarDataExtenso(momento)}
        </p>
        <p className="mt-1 font-sans text-xs text-neutro">{user?.email}</p>
      </header>

      {erro ? (
        <p
          role="alert"
          className="mt-8 rounded-md border border-argila/35 bg-argila-suave px-4 py-3 font-sans text-sm text-argila"
        >
          Não foi possível carregar os dados. {erro.message}
        </p>
      ) : null}

      <section className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/painel/pacientes"
          className="rounded-md bg-vital px-5 py-2.5 font-sans text-sm font-semibold text-white transition hover:bg-vital/10"
        >
          Ver pacientes
        </Link>
        <Link
          href="/painel/esteira"
          className="rounded-md border border-linha px-5 py-2.5 font-sans text-sm text-vital-fundo transition hover:bg-vital/10"
        >
          Ver a esteira
        </Link>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi rotulo="Pacientes" valor={pacientes.length} rodape="no total" />
        <Kpi
          rotulo="Novos pacientes"
          valor={contarNovos(pacientes, 30, momento)}
          rodape="nos últimos 30 dias"
        />
        <Kpi
          rotulo="Check-ins"
          valor={contagem7Res.count ?? 0}
          rodape="nos últimos 7 dias"
        />
        <Kpi
          rotulo="Adesão média"
          valor={
            adesao ? <SeloAdesao valor={adesao.rotulo} /> : "sem dados"
          }
          rodape={
            adesao
              ? `${adesao.media.toLocaleString("pt-BR", {
                  maximumFractionDigits: 1,
                })} de 10, em ${adesao.base} ${
                  adesao.base === 1 ? "resposta" : "respostas"
                }`
              : "nenhuma resposta em 30 dias"
          }
        />
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl text-vital-fundo">
              Precisam de atenção
            </h2>
            {atencao.length > 0 ? (
              <span className="font-sans text-xs text-neutro">
                {atencao.length}
              </span>
            ) : null}
          </div>
          <p className="mt-1 font-sans text-xs text-neutro">
            Sem check-in há mais de {DIAS_ATENCAO} dias
          </p>

          {atencao.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-linha px-6 py-10 text-center">
              <p className="font-display text-lg text-neutro">Todos em dia</p>
              <p className="mt-2 font-sans text-sm text-neutro">
                Ninguém está atrasado no check-in.
              </p>
            </div>
          ) : (
            <ul className="mt-5 space-y-2">
              {atencao.map((paciente) => (
                <li key={paciente.id}>
                  <Link
                    href={`/painel/pacientes/${paciente.id}`}
                    className="flex items-center justify-between gap-4 rounded-lg border border-linha bg-cartao px-4 py-3 transition hover:border-linha"
                  >
                    <span className="min-w-0 truncate font-sans text-sm text-tinta">
                      {paciente.full_name}
                    </span>
                    <span className="shrink-0 font-sans text-xs text-mel-tinta">
                      {paciente.diasSemCheckin === null
                        ? "nunca respondeu"
                        : `há ${paciente.diasSemCheckin} dias`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-display text-xl text-vital-fundo">
            Check-ins recentes
          </h2>
          <p className="mt-1 font-sans text-xs text-neutro">
            As últimas respostas que chegaram
          </p>

          {recentes.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-linha px-6 py-10 text-center">
              <p className="font-display text-lg text-neutro">
                Nenhum check-in ainda
              </p>
              <p className="mt-2 font-sans text-sm text-neutro">
                Envie o link de check-in para os seus pacientes.
              </p>
            </div>
          ) : (
            <ul className="mt-5 space-y-2">
              {recentes.map((checkin) => (
                <li key={checkin.id}>
                  <Link
                    href={`/painel/pacientes/${checkin.patient_id}`}
                    className="flex items-center justify-between gap-4 rounded-lg border border-linha bg-cartao px-4 py-3 transition hover:border-linha"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-sans text-sm text-tinta">
                        {checkin.patients?.full_name ?? "Paciente removido"}
                      </span>
                      <span className="block font-sans text-xs text-neutro">
                        {formatarData(checkin.created_at)}
                      </span>
                    </span>
                    <span className="shrink-0 font-sans text-sm tabular-nums text-neutro">
                      {formatarPeso(checkin.peso_kg) ?? "sem peso"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="mt-10 font-sans text-xs text-neutro">
        Os indicadores de vendas e financeiro entram aqui quando essas áreas
        forem construídas.
      </p>
    </>
  );
}
