import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DIMENSOES_DA_FICHA } from "@/lib/dimensoes";
import { statusEfetivo, type CheckinLink } from "@/lib/links";
import { agora } from "@/lib/visao-geral";
import { Cartao, Olho, Selo, SeloLink, TituloPagina, CLASSE_BOTAO_SECUNDARIO } from "../ui";

export const metadata: Metadata = {
  title: "Visão do paciente, Larissa Freire Nutricionista",
};

const PASSOS = [
  {
    titulo: "Você gera o link",
    texto:
      "Em Links, escolhe o paciente e a semana. Cada link é individual e vale por 7 dias.",
  },
  {
    titulo: "O paciente responde",
    texto:
      "Ele abre o link no celular, sem senha e sem instalar nada, e leva uns 3 minutos.",
  },
  {
    titulo: "A resposta chega até você",
    texto:
      "Ela entra na Esteira como Respondido, e o que tiver alerta clínico sobe para o topo da Triagem.",
  },
];

export default async function VisaoPacientePage() {
  const supabase = await createClient();
  const momento = agora();

  // Um link vivo serve de amostra para a prévia, sem inventar nada.
  const { data } = await supabase
    .from("checkin_links")
    .select("*, patients(id, full_name)")
    .in("status", ["gerado", "enviado"])
    .order("gerado_em", { ascending: false })
    .limit(1);

  const exemplo = ((data ?? []) as unknown as CheckinLink[])[0] ?? null;
  const vivo = exemplo && statusEfetivo(exemplo, momento) !== "expirado";

  return (
    <>
      <TituloPagina
        olho="Modo paciente"
        titulo="O que o paciente vê"
        apoio="O paciente não faz login. Ele responde pelo link semanal que você envia, e é só isso que ele acessa."
      />

      <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Cartao className="px-6 py-6">
          <h2 className="font-display text-[21px] text-barra">
            Como o check-in chega até ele
          </h2>

          <ol className="mt-5 space-y-5">
            {PASSOS.map((p, i) => (
              <li key={p.titulo} className="flex gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-areia-clara font-mono text-[13px] font-bold text-vital-fundo">
                  {i + 1}
                </span>
                <span>
                  <span className="block font-sans text-[15.5px] font-semibold text-tinta">
                    {p.titulo}
                  </span>
                  <span className="mt-1 block font-sans text-[14px] leading-relaxed text-neutro">
                    {p.texto}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-wrap gap-2 border-t border-linha pt-5">
            <Link href="/painel/links" className={CLASSE_BOTAO_SECUNDARIO}>
              Ir para Links
            </Link>
            {vivo && exemplo ? (
              <a
                href={`/checkin/${exemplo.token}`}
                target="_blank"
                rel="noopener noreferrer"
                className={CLASSE_BOTAO_SECUNDARIO}
              >
                Abrir um check-in de verdade
              </a>
            ) : null}
          </div>

          {vivo && exemplo ? (
            <p className="mt-4 flex flex-wrap items-center gap-2 font-sans text-[13px] text-neutro">
              usando o link de {exemplo.patients?.full_name ?? "um paciente"},
              semana {exemplo.semana ?? "sem número"}
              <SeloLink status={statusEfetivo(exemplo, momento)} />
            </p>
          ) : (
            <p className="mt-4 font-sans text-[13px] text-neutro">
              Não há nenhum link aberto agora. Gere um em Links para ver a tela
              real que o paciente recebe.
            </p>
          )}
        </Cartao>

        <Cartao className="px-6 py-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-[21px] text-barra">
              O que ele responde
            </h2>
            <span className="font-mono text-[12px] text-neutro">
              10 perguntas
            </span>
          </div>
          <p className="mt-1 font-sans text-[13.5px] text-neutro">
            Prévia somente leitura, com as cores de cada dimensão
          </p>

          <ul className="mt-5 space-y-3.5">
            {DIMENSOES_DA_FICHA.map((d) => (
              <li key={d.campo}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-sans text-[14px] text-tinta">
                    {d.rotulo}
                  </span>
                  <span className="font-mono text-[11.5px] text-tenue">
                    0 a 10
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-areia">
                  <div
                    className="h-full w-[70%] rounded-full"
                    style={{ backgroundColor: d.cor }}
                  />
                </div>
                <p className="mt-1 flex justify-between font-mono text-[10.5px] text-tenue">
                  <span>{d.baixo}</span>
                  <span>{d.alto}</span>
                </p>
              </li>
            ))}
          </ul>

          <p className="mt-5 border-t border-linha pt-4 font-sans text-[13.5px] leading-relaxed text-neutro">
            Além das notas, ele informa o peso, escreve como foi a semana e pode
            sinalizar dor ou mal-estar, que vira alerta clínico.
          </p>
        </Cartao>
      </div>

      <Cartao className="mt-5 px-6 py-6">
        <Olho>Recurso futuro</Olho>
        <h2 className="mt-2 font-display text-[21px] text-barra">
          Portal do paciente
        </h2>
        <p className="mt-2 max-w-2xl font-sans text-[14.5px] leading-relaxed text-neutro">
          Um portal com login próprio, onde o paciente veria a evolução dele e o
          histórico das semanas, ainda não existe. Hoje o acesso é só pelo link
          semanal, o que também é mais simples para ele e guarda menos dado
          exposto. Quando fizer sentido, essa é a próxima porta a abrir.
        </p>
        <div className="mt-4">
          <Selo tom="mel">em breve</Selo>
        </div>
      </Cartao>
    </>
  );
}
