import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatarData, formatarPeso, formatarVariacao } from "@/lib/formato";
import { DIMENSOES_DA_FICHA, notaDe, notasPreenchidas } from "@/lib/dimensoes";
import { urlBase } from "@/lib/url-base";
import { diaDeHoje } from "@/lib/financeiro";
import { agora } from "@/lib/visao-geral";
import { segundaDaSemana } from "@/lib/semana";
import type { Checkin, Paciente } from "@/lib/tipos";
import { Cartao, Medidor } from "../painel/ui";
import { LinhaEvolucao } from "../painel/pacientes/[id]/evolucao";
import { BemVinda } from "./bem-vinda";

export default async function MeuAcompanhamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ novo?: string }>;
}) {
  const { novo } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  // RLS devolve só o registro vinculado a esta conta, e só os check-ins
  // deste paciente. A proteção dos dados mora aqui, no banco.
  const { data: dadosPaciente } = await supabase
    .from("patients")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!dadosPaciente) {
    return (
      <Cartao className="px-6 py-8 text-center">
        <p className="font-sans text-[15px] text-neutro">
          Não encontramos o seu acompanhamento. Fale com a Larissa pelo
          WhatsApp.
        </p>
      </Cartao>
    );
  }

  const paciente = dadosPaciente as Paciente;
  const primeiro = paciente.full_name.split(" ")[0];
  const enderecoLogin = `${await urlBase()}/entrar`;

  const { data: dadosCheckins } = await supabase
    .from("checkins")
    .select("*")
    .eq("patient_id", paciente.id)
    .order("created_at", { ascending: false });

  const checkins = (dadosCheckins ?? []) as Checkin[];
  const ultimo = checkins[0] ?? null;

  // Check-in da semana corrente, de segunda a domingo. No máximo um por
  // semana, então uma linha diz o estado: aberto, respondido ou nenhum.
  const segunda = segundaDaSemana(diaDeHoje(agora()));
  const { data: linkSemana } = await supabase
    .from("checkin_links")
    .select("id, status")
    .eq("patient_id", paciente.id)
    .eq("semana_inicio", segunda)
    .neq("status", "expirado")
    .maybeSingle();

  const semanaAberta =
    linkSemana?.status === "gerado" || linkSemana?.status === "enviado";
  const semanaRespondida = linkSemana?.status === "respondido";

  // Peso atual é o último informado, e a variação compara com o de
  // partida, o peso inicial do cadastro ou o primeiro check-in com peso.
  const comPeso = checkins.filter((c) => c.peso_kg !== null);
  const pesoAtual = comPeso[0]?.peso_kg ?? null;
  const pesoPartida =
    paciente.peso_inicial ??
    (comPeso.length > 0 ? comPeso[comPeso.length - 1].peso_kg : null);
  const variacao =
    pesoAtual !== null && pesoPartida !== null
      ? pesoAtual - pesoPartida
      : null;

  return (
    <>
      {novo === "1" ? <BemVinda enderecoLogin={enderecoLogin} /> : null}

      <section>
        <h1 className="font-display text-[28px] leading-tight text-barra">
          Olá, {primeiro}!
        </h1>
        <p className="mt-1 font-sans text-[15px] text-neutro">
          Aqui você acompanha a sua evolução, do seu jeito e no seu tempo.
        </p>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <Cartao className="px-5 py-4">
          <p className="olho">Peso atual</p>
          <p className="mt-1.5 font-display text-[24px] text-barra">
            {formatarPeso(pesoAtual) ?? "a informar"}
          </p>
        </Cartao>
        <Cartao className="px-5 py-4">
          <p className="olho">Peso de partida</p>
          <p className="mt-1.5 font-display text-[24px] text-barra">
            {formatarPeso(pesoPartida) ?? "a informar"}
          </p>
        </Cartao>
        <Cartao className="px-5 py-4">
          <p className="olho">Variação</p>
          <p
            className={`mt-1.5 font-display text-[24px] ${
              variacao === null
                ? "text-neutro"
                : variacao < 0
                  ? "text-emerald-700"
                  : variacao > 0
                    ? "text-mel-tinta"
                    : "text-barra"
            }`}
          >
            {variacao === null ? "a informar" : formatarVariacao(variacao)}
          </p>
        </Cartao>
      </section>

      {/* Check-in da semana, o aviso principal da entrada. */}
      <section className="mt-4">
        {semanaAberta ? (
          <div className="rounded-2xl border border-vital/40 bg-vital/5 px-6 py-6">
            <p className="olho text-vital-fundo">Check-in desta semana</p>
            <h2 className="mt-2 font-display text-[22px] text-barra">
              Seu check-in desta semana está aberto
            </h2>
            <p className="mt-1.5 font-sans text-[14.5px] leading-relaxed text-neutro">
              Leva uns 3 minutos, respondendo com sinceridade. É o que ajuda a
              Larissa a ajustar o seu plano.
            </p>
            <Link
              href="/meu-acompanhamento/check-in"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-vital px-5 py-3 font-sans text-[15px] font-semibold text-white shadow-acao transition hover:brightness-105"
            >
              Responder agora
            </Link>
          </div>
        ) : semanaRespondida ? (
          <div className="rounded-2xl border border-emerald-600/30 bg-emerald-50 px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-600/15">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#047857" strokeWidth="2.5" aria-hidden>
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <div>
                <p className="font-sans text-[15px] font-semibold text-emerald-800">
                  Check-in desta semana enviado, obrigada!
                </p>
                <p className="mt-0.5 font-sans text-[13.5px] text-emerald-700">
                  A Larissa vai analisar e te dar um retorno. Bom descanso.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-linha bg-cartao px-6 py-6 text-center">
            <p className="font-sans text-[15px] font-semibold text-tinta">
              Nenhum check-in aberto por enquanto
            </p>
            <p className="mx-auto mt-1.5 max-w-md font-sans text-[13.5px] leading-relaxed text-neutro">
              Seu próximo check-in abre na segunda. Quando estiver disponível,
              ele aparece aqui em destaque.
            </p>
          </div>
        )}
      </section>

      {ultimo && notasPreenchidas(ultimo) > 0 ? (
        <section className="mt-4">
          <Cartao>
            <header className="border-b border-linha px-6 py-4">
              <h2 className="font-display text-[19px] text-barra">
                Seu último check-in
              </h2>
              <p className="mt-0.5 font-sans text-[13px] text-neutro">
                {ultimo.semana ? `Semana ${ultimo.semana}, ` : ""}
                {formatarData(ultimo.created_at)}
              </p>
            </header>
            <div className="px-6 py-5">
              {DIMENSOES_DA_FICHA.map((d) => (
                <Medidor
                  key={d.campo}
                  rotulo={d.rotulo}
                  nota={notaDe(ultimo, d.campo)}
                  cor={d.cor}
                />
              ))}
            </div>
          </Cartao>
        </section>
      ) : null}

      <section className="mt-6">
        <h2 className="font-display text-[21px] text-barra">Sua evolução</h2>
        <p className="mt-1 font-sans text-[14px] text-neutro">
          Como cada ponto mudou ao longo das semanas. Toque num ponto para ver a
          data e o valor.
        </p>
        <div className="mt-4">
          <LinhaEvolucao checkins={checkins} />
        </div>
      </section>
    </>
  );
}
