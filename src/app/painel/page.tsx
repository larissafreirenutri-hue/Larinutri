import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatarData } from "@/lib/formato";
import { agora } from "@/lib/visao-geral";
import { diaDaSemana, engajamentoPorSemana, QUEDA_RELEVANTE, diasAte } from "@/lib/triagem";
import type { NotasPaciente } from "@/lib/carteira";
import { Avatar } from "./marca";
import { Cartao, Olho, Selo } from "./ui";
import { Engajamento } from "./engajamento";

export const metadata: Metadata = {
  title: "Triagem, Larissa Freire Nutricionista",
};

const DIA = 24 * 60 * 60 * 1000;

function Kpi({
  rotulo,
  valor,
  rodape,
  cor,
}: {
  rotulo: string;
  valor: number;
  rodape: string;
  cor?: string;
}) {
  return (
    <Cartao className="px-5 py-5">
      <Olho>{rotulo}</Olho>
      <p className={`mt-2 font-display text-[38px] leading-none ${cor ?? "text-barra"}`}>
        {valor}
      </p>
      <p className="mt-3 font-sans text-[14px] text-neutro">{rodape}</p>
    </Cartao>
  );
}

export default async function TriagemPage() {
  const supabase = await createClient();
  const momento = agora();
  const limiteVencimento = new Date(momento + 7 * DIA).toISOString().slice(0, 10);
  const hoje = new Date(momento).toISOString().slice(0, 10);

  const [
    ativosRes,
    aAnalisarRes,
    alertasRes,
    vencendoRes,
    notasRes,
    pacientesRes,
    linksRes,
    pendentesRes,
  ] = await Promise.all([
    supabase.from("patients").select("id", { count: "exact", head: true }).eq("status", "ativo"),
    supabase.from("checkins").select("id", { count: "exact", head: true }).eq("triagem", "respondido"),
    supabase
      .from("checkins")
      .select("id, patient_id, created_at, alerta_clinico, patients(full_name, objetivo)")
      .not("alerta_clinico", "is", null)
      .neq("triagem", "analisado")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("patients")
      .select("id, full_name, plano_vence")
      .not("plano_vence", "is", null)
      .gte("plano_vence", hoje)
      .lte("plano_vence", limiteVencimento)
      .order("plano_vence"),
    supabase.from("patient_scores").select("*"),
    supabase.from("patients").select("id, full_name, status"),
    supabase.from("checkin_links").select("gerado_em, status").gte("gerado_em", new Date(momento - 45 * DIA).toISOString()),
    supabase
      .from("checkin_links")
      .select("id, patient_id, gerado_em, expira_em, status, patients(full_name)")
      .in("status", ["gerado", "enviado"])
      .order("gerado_em", { ascending: false })
      .limit(8),
  ]);

  const erro =
    ativosRes.error ?? aAnalisarRes.error ?? alertasRes.error ??
    vencendoRes.error ?? notasRes.error ?? pacientesRes.error ??
    linksRes.error ?? pendentesRes.error;

  type Alerta = {
    id: string;
    patient_id: string;
    created_at: string;
    alerta_clinico: string;
    patients: { full_name: string; objetivo: string | null } | null;
  };
  type Pendente = {
    id: string;
    patient_id: string;
    gerado_em: string;
    expira_em: string;
    status: string;
    patients: { full_name: string } | null;
  };

  const alertas = (alertasRes.data ?? []) as unknown as Alerta[];
  const notas = (notasRes.data ?? []) as NotasPaciente[];
  const nomes = new Map(
    ((pacientesRes.data ?? []) as { id: string; full_name: string }[]).map((p) => [p.id, p.full_name]),
  );

  const regrediram = notas
    .filter(
      (n) =>
        n.nota_atual !== null &&
        n.nota_anterior !== null &&
        n.nota_anterior - n.nota_atual >= QUEDA_RELEVANTE,
    )
    .map((n) => ({
      id: n.patient_id,
      nome: nomes.get(n.patient_id) ?? "Paciente removido",
      de: n.nota_anterior as number,
      para: n.nota_atual as number,
    }))
    .sort((a, b) => a.para - a.de - (b.para - b.de));

  const pendentes = ((pendentesRes.data ?? []) as unknown as Pendente[]).filter(
    (l) => Date.parse(l.expira_em) > momento,
  );

  const semanas = engajamentoPorSemana(
    (linksRes.data ?? []) as { gerado_em: string; status: string }[],
    momento,
  );

  const vencendo = (vencendoRes.data ?? []) as {
    id: string;
    full_name: string;
    plano_vence: string;
  }[];

  return (
    <>
      <Olho>{diaDaSemana(momento)} · sua semana</Olho>
      <h1 className="mt-2 font-display text-[30px] leading-[1.1] text-barra sm:text-[40px]">
        Triagem da semana
      </h1>
      <p className="mt-2 max-w-2xl font-sans text-[15px] text-neutro">
        O que precisa da sua atenção agora, do mais urgente ao acompanhamento de rotina.
      </p>

      {erro ? (
        <p role="alert" className="mt-8 rounded-xl border border-argila/35 bg-argila-suave px-4 py-3 font-sans text-sm text-argila">
          Não foi possível carregar a triagem. {erro.message}
        </p>
      ) : null}

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi rotulo="Pacientes ativos" valor={ativosRes.count ?? 0} rodape="carteira em acompanhamento" />
        <Kpi rotulo="Check-ins a analisar" valor={aAnalisarRes.count ?? 0} rodape="respondidos, aguardando você" cor="text-mel" />
        <Kpi rotulo="Alertas clínicos" valor={alertas.length} rodape="pacientes que sinalizaram algo" cor="text-argila" />
        <Kpi rotulo="Vencendo em 7 dias" valor={vencendo.length} rodape="planos a renovar" />
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="grid gap-5 content-start">
          <Cartao>
            <header className="border-b border-linha px-6 py-5">
              <h2 className="flex items-center gap-2.5 font-display text-[21px] text-barra">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                  <path d="M12 4l9 15H3l9-15z" strokeLinejoin="round" />
                  <path d="M12 10v4M12 16.5v.5" strokeLinecap="round" />
                </svg>
                Alertas clínicos no topo
              </h2>
            </header>

            <div className="px-6 py-5">
              {alertas.length === 0 ? (
                <p className="py-8 text-center font-sans text-[14.5px] text-neutro">
                  Nenhum alerta em aberto. Bom sinal.
                </p>
              ) : (
                <ul className="space-y-3">
                  {alertas.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/painel/pacientes/${a.patient_id}`}
                        className="block rounded-r-xl border-l-4 border-argila bg-argila-suave px-4 py-3.5 transition hover:brightness-[0.98]"
                      >
                        <p className="font-sans text-[15px] font-semibold text-argila">
                          {a.patients?.full_name ?? "Paciente removido"}
                          {a.patients?.objetivo ? ` · ${a.patients.objetivo}` : ""}
                        </p>
                        <p className="mt-1 font-sans text-[14px] leading-relaxed text-tinta">
                          {a.alerta_clinico}
                        </p>
                        <p className="mt-1.5 font-mono text-[11.5px] text-neutro">
                          {formatarData(a.created_at)}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Cartao>

          <Cartao>
            <header className="flex items-baseline justify-between border-b border-linha px-6 py-5">
              <h2 className="font-display text-[21px] text-barra">Quem regrediu</h2>
              <span className="font-mono text-[12px] text-neutro">queda na nota geral</span>
            </header>

            <div className="px-6 py-5">
              {regrediram.length === 0 ? (
                <p className="py-8 text-center font-sans text-[14.5px] text-neutro">
                  Ninguém em queda relevante. Bom sinal.
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {regrediram.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/painel/pacientes/${r.id}`}
                        className="flex items-center justify-between gap-4 rounded-xl border border-linha px-4 py-3 transition hover:border-vital/50"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <Avatar nome={r.nome} tamanho="sm" />
                          <span className="truncate font-sans text-[15px] text-tinta">{r.nome}</span>
                        </span>
                        <span className="shrink-0 font-mono text-[13px] font-bold text-argila">
                          {r.de} ▼ {r.para}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Cartao>
        </div>

        <div className="grid gap-5 content-start">
          <Cartao>
            <header className="flex items-baseline justify-between border-b border-linha px-6 py-5">
              <h2 className="font-display text-[21px] text-barra">A responder</h2>
              <Link href="/painel/esteira" className="font-sans text-[14px] font-medium text-vital-fundo transition hover:text-vital">
                ver esteira
              </Link>
            </header>

            <div className="px-6 py-5">
              {pendentes.length === 0 ? (
                <p className="py-8 text-center font-sans text-[14.5px] text-neutro">
                  Ninguém pendente. Todos responderam.
                </p>
              ) : (
                <ul className="space-y-3">
                  {pendentes.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/painel/pacientes/${p.patient_id}`}
                        className="flex items-center justify-between gap-4 rounded-xl px-1 py-1.5 transition hover:bg-areia-clara/60"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <Avatar nome={p.patients?.full_name ?? "?"} />
                          <span className="min-w-0">
                            <span className="block truncate font-sans text-[15.5px] font-semibold text-tinta">
                              {p.patients?.full_name ?? "Paciente removido"}
                            </span>
                            <span className="block font-sans text-[13.5px] text-neutro">
                              {p.status === "enviado" ? "enviado" : "gerado"} {formatarData(p.gerado_em)}
                            </span>
                          </span>
                        </span>
                        <Selo tom="mel">aguardando</Selo>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Cartao>

          {vencendo.length > 0 ? (
            <Cartao>
              <header className="border-b border-linha px-6 py-5">
                <h2 className="font-display text-[21px] text-barra">Planos a renovar</h2>
              </header>
              <ul className="px-6 py-5 space-y-2.5">
                {vencendo.map((v) => (
                  <li key={v.id}>
                    <Link
                      href={`/painel/pacientes/${v.id}`}
                      className="flex items-center justify-between gap-4 rounded-xl border border-linha px-4 py-3 transition hover:border-vital/50"
                    >
                      <span className="truncate font-sans text-[15px] text-tinta">{v.full_name}</span>
                      <span className="shrink-0 font-mono text-[12.5px] text-mel-tinta">
                        em {diasAte(v.plano_vence, momento)} dias
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Cartao>
          ) : null}

          <Engajamento semanas={semanas} />
        </div>
      </div>
    </>
  );
}
