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
import { Kpi, SeloAdesao } from "./pacientes/indicadores";

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
        .select("adesao_plano")
        .gte("created_at", desde30)
        .not("adesao_plano", "is", null),
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
    (adesaoRes.data ?? []).map((l) => l.adesao_plano as string | null),
  );

  return (
    <>
      <header className="border-b border-dourado/15 pb-6">
        <h1 className="font-display text-3xl text-creme">
          {saudacao(momento)}, Larissa
        </h1>
        <p className="mt-2 font-sans text-sm text-creme/55">
          {formatarDataExtenso(momento)}
        </p>
        <p className="mt-1 font-sans text-xs text-creme/35">{user?.email}</p>
      </header>

      {erro ? (
        <p
          role="alert"
          className="mt-8 rounded-md border border-red-300/40 bg-red-900/20 px-4 py-3 font-sans text-sm text-red-100"
        >
          Não foi possível carregar os dados. {erro.message}
        </p>
      ) : null}

      <section className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/painel/pacientes"
          className="rounded-md bg-dourado px-5 py-2.5 font-sans text-sm font-semibold text-marrom transition hover:bg-dourado/90"
        >
          Ver pacientes
        </Link>
        <Link
          href="/painel/pacientes/checkins"
          className="rounded-md border border-dourado/40 px-5 py-2.5 font-sans text-sm text-dourado transition hover:bg-dourado/10"
        >
          Revisar check-ins
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
                })} de 3, em ${adesao.base} ${
                  adesao.base === 1 ? "resposta" : "respostas"
                }`
              : "nenhuma resposta em 30 dias"
          }
        />
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl text-dourado">
              Precisam de atenção
            </h2>
            {atencao.length > 0 ? (
              <span className="font-sans text-xs text-creme/45">
                {atencao.length}
              </span>
            ) : null}
          </div>
          <p className="mt-1 font-sans text-xs text-creme/40">
            Sem check-in há mais de {DIAS_ATENCAO} dias
          </p>

          {atencao.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-dourado/25 px-6 py-10 text-center">
              <p className="font-display text-lg text-creme/70">Todos em dia</p>
              <p className="mt-2 font-sans text-sm text-creme/45">
                Ninguém está atrasado no check-in.
              </p>
            </div>
          ) : (
            <ul className="mt-5 space-y-2">
              {atencao.map((paciente) => (
                <li key={paciente.id}>
                  <Link
                    href={`/painel/pacientes/${paciente.id}`}
                    className="flex items-center justify-between gap-4 rounded-lg border border-dourado/20 bg-creme/5 px-4 py-3 transition hover:border-dourado/40"
                  >
                    <span className="min-w-0 truncate font-sans text-sm text-creme/90">
                      {paciente.full_name}
                    </span>
                    <span className="shrink-0 font-sans text-xs text-amber-200/80">
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
          <h2 className="font-display text-xl text-dourado">
            Check-ins recentes
          </h2>
          <p className="mt-1 font-sans text-xs text-creme/40">
            As últimas respostas que chegaram
          </p>

          {recentes.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-dourado/25 px-6 py-10 text-center">
              <p className="font-display text-lg text-creme/70">
                Nenhum check-in ainda
              </p>
              <p className="mt-2 font-sans text-sm text-creme/45">
                Envie o link de check-in para os seus pacientes.
              </p>
            </div>
          ) : (
            <ul className="mt-5 space-y-2">
              {recentes.map((checkin) => (
                <li key={checkin.id}>
                  <Link
                    href={`/painel/pacientes/${checkin.patient_id}`}
                    className="flex items-center justify-between gap-4 rounded-lg border border-dourado/20 bg-creme/5 px-4 py-3 transition hover:border-dourado/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-sans text-sm text-creme/90">
                        {checkin.patients?.full_name ?? "Paciente removido"}
                      </span>
                      <span className="block font-sans text-xs text-creme/40">
                        {formatarData(checkin.created_at)}
                      </span>
                    </span>
                    <span className="shrink-0 font-sans text-sm tabular-nums text-creme/70">
                      {formatarPeso(checkin.peso_kg) ?? "sem peso"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="mt-10 font-sans text-xs text-creme/30">
        Os indicadores de vendas e financeiro entram aqui quando essas áreas
        forem construídas.
      </p>
    </>
  );
}
