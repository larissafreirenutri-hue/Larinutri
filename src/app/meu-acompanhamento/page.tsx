import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatarData, formatarPeso, formatarVariacao } from "@/lib/formato";
import { DIMENSOES_DA_FICHA, notaDe, notasPreenchidas } from "@/lib/dimensoes";
import type { Checkin, Paciente } from "@/lib/tipos";
import { Cartao, Medidor } from "../painel/ui";
import { LinhaEvolucao } from "../painel/pacientes/[id]/evolucao";

export const metadata: Metadata = {
  title: "Meu acompanhamento, Larissa Freire",
};

export default async function MeuAcompanhamentoPage() {
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

  const { data: dadosCheckins } = await supabase
    .from("checkins")
    .select("*")
    .eq("patient_id", paciente.id)
    .order("created_at", { ascending: false });

  const checkins = (dadosCheckins ?? []) as Checkin[];
  const ultimo = checkins[0] ?? null;

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

      {/* Placeholder do check-in, que chega na próxima fase. */}
      <section className="mt-4">
        <div className="rounded-2xl border border-dashed border-linha bg-cartao px-6 py-6 text-center">
          <p className="font-sans text-[15px] font-semibold text-tinta">
            Seu check-in aparece aqui toda semana
          </p>
          <p className="mx-auto mt-1.5 max-w-md font-sans text-[13.5px] leading-relaxed text-neutro">
            Em breve você responde o seu check-in por aqui mesmo. Por enquanto,
            siga pelo link que a Larissa te envia.
          </p>
        </div>
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
