"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { DIMENSOES, corDaNota } from "@/lib/dimensoes";
import { enviarCheckinRico, type EstadoCheckin } from "./actions";
import { FotosDaSemana } from "./fotos";

const SECOES = [
  {
    chave: "alimentacao" as const,
    titulo: "Alimentação e adesão",
    apoio:
      "O coração do check-in. Seja sincero, é o que deixa a sua nutri te ajudar melhor.",
  },
  {
    chave: "treino" as const,
    titulo: "Treino e recuperação",
    apoio: "Como o corpo respondeu ao esforço da semana.",
  },
  {
    chave: "bemestar" as const,
    titulo: "Bem-estar",
    apoio: "Digestão, sono e humor conversam entre si e com a sua alimentação.",
  },
  {
    chave: "fechamento" as const,
    titulo: "Fechamento",
    apoio: "Quase lá. Só mais um panorama geral.",
  },
];

function Secao({
  titulo,
  apoio,
  children,
}: {
  titulo: string;
  apoio: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4 rounded-[18px] border border-linha bg-cartao p-[22px] shadow-cartao">
      <h2 className="font-display text-[19px] text-barra">{titulo}</h2>
      <p className="mb-4 mt-[3px] font-sans text-[13px] text-neutro">{apoio}</p>
      {children}
    </section>
  );
}

function Deslizante({
  campo,
  rotulo,
  cor,
  baixo,
  alto,
}: {
  campo: string;
  rotulo: string;
  cor: string;
  baixo: string;
  alto: string;
}) {
  const [nota, setNota] = useState(7);
  const corAtual = corDaNota(nota, cor);
  const preenchido = nota * 10;

  return (
    <div className="mb-5 last:mb-0">
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={campo}
          className="font-sans text-[15px] font-semibold text-tinta"
        >
          {rotulo}
        </label>
        <output
          htmlFor={campo}
          className="font-mono text-[22px] font-bold tabular-nums"
          style={{ color: corAtual }}
        >
          {nota}
        </output>
      </div>

      <input
        id={campo}
        name={campo}
        type="range"
        min={0}
        max={10}
        step={1}
        value={nota}
        onChange={(e) => setNota(Number(e.target.value))}
        className="deslizante mt-3 w-full"
        style={{
          background: `linear-gradient(90deg, ${corAtual} ${preenchido}%, #E4D8C2 ${preenchido}%)`,
        }}
      />

      <div className="mt-1.5 flex justify-between font-mono text-[11px] text-neutro">
        <span>0 · {baixo}</span>
        <span>{alto} · 10</span>
      </div>
    </div>
  );
}

/**
 * Refeição livre. O tom é deliberadamente leve: ela faz parte do
 * plano, e perguntar com cara de fiscalização faz o paciente mentir,
 * que é justamente o que estraga o acompanhamento.
 */
function RefeicaoLivre() {
  const [teve, setTeve] = useState<boolean | null>(null);

  const botao = (ativo: boolean) =>
    `flex-1 rounded-xl border px-4 py-2.5 font-sans text-[15px] font-medium transition ${
      ativo
        ? "border-vital bg-vital text-white"
        : "border-linha bg-white text-tinta hover:border-vital/50"
    }`;

  return (
    <div className="mt-6 border-t border-linha pt-5">
      <p className="font-sans text-[15px] font-semibold text-tinta">
        Teve refeição livre nesta semana?
      </p>
      <p className="mt-1 font-sans text-[13px] text-neutro">
        Refeição livre faz parte do plano. Responder com sinceridade ajuda a
        sua nutri a ajustar, não a cobrar.
      </p>

      {/* O valor real vai num campo escondido, para o servidor receber
          sempre algo definido, mesmo se ninguém tocar nos botões. */}
      <input
        type="hidden"
        name="refeicao_livre"
        value={teve === null ? "" : teve ? "sim" : "nao"}
      />

      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={() => setTeve(true)}
          aria-pressed={teve === true}
          className={botao(teve === true)}
        >
          Sim
        </button>
        <button
          type="button"
          onClick={() => setTeve(false)}
          aria-pressed={teve === false}
          className={botao(teve === false)}
        >
          Não
        </button>
      </div>

      {teve ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-[120px_minmax(0,1fr)]">
          <div>
            <label
              htmlFor="refeicao_livre_qtd"
              className="block font-sans text-[13px] font-semibold text-tinta"
            >
              Quantas vezes?
            </label>
            <input
              id="refeicao_livre_qtd"
              name="refeicao_livre_qtd"
              type="number"
              min={0}
              max={50}
              step={1}
              defaultValue={1}
              inputMode="numeric"
              className="mt-1.5 w-full rounded-[10px] border border-linha bg-white px-3 py-2.5 font-sans text-[14px] text-tinta outline-none focus:border-vital"
            />
          </div>

          <div>
            <label
              htmlFor="refeicao_livre_oque"
              className="block font-sans text-[13px] font-semibold text-tinta"
            >
              O que você comeu?
            </label>
            <input
              id="refeicao_livre_oque"
              name="refeicao_livre_oque"
              maxLength={200}
              placeholder="Ex: pizza no sábado, sobremesa no almoço"
              className="mt-1.5 w-full rounded-[10px] border border-linha bg-white px-3 py-2.5 font-sans text-[14px] text-tinta placeholder:text-tenue outline-none focus:border-vital"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BotaoEnviar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-vital px-6 py-3.5 font-sans text-[15px] font-semibold text-white shadow-acao transition hover:brightness-105 disabled:opacity-60"
    >
      {pending ? "Enviando..." : "Enviar check-in"}
    </button>
  );
}

export function FormularioRico({
  token,
  primeiroNome,
  semana,
}: {
  token: string;
  primeiroNome: string;
  semana: number | null;
}) {
  const [estado, acao] = useActionState<EstadoCheckin, FormData>(
    enviarCheckinRico,
    {},
  );
  const [temAlerta, setTemAlerta] = useState(false);

  if (estado.ok) {
    return (
      <div className="mx-auto my-12 max-w-[520px] rounded-[20px] border border-linha bg-cartao px-8 py-10 text-center shadow-cartao">
        <div className="mx-auto mb-5 grid h-[70px] w-[70px] place-items-center rounded-full bg-areia-clara">
          <svg
            width="34"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#A9723F"
            strokeWidth="2.4"
            aria-hidden
          >
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="font-display text-[26px] text-barra">
          Recebido, {primeiroNome}!
        </h2>
        <p className="mt-2 font-sans text-[15px] text-neutro">
          Suas respostas já estão com a nutricionista. Ela vai analisar e te dar
          um retorno em breve. Bom descanso e uma ótima semana.
        </p>
      </div>
    );
  }

  return (
    <form action={acao}>
      <input type="hidden" name="token" value={token} />

      <div className="mb-[18px] rounded-[20px] bg-gradient-to-br from-barra to-barra-alta p-[26px]">
        <p className="olho text-dourado">Acompanhamento da semana</p>
        <h1 className="mt-2 font-display text-[24px] text-sobre-escuro-forte">
          Olá, {primeiroNome}!
        </h1>
        <p className="mt-2 font-sans text-[14.5px] leading-relaxed text-sobre-escuro-suave">
          {semana === null
            ? "Chegamos ao seu check-in."
            : `Chegamos ao seu check-in da semana ${semana}.`}{" "}
          São uns 3 minutinhos, respondendo com sinceridade. É isso que ajuda a
          sua nutri a entender como você está e ajustar seu plano.
        </p>
      </div>

      <Secao
        titulo="Seu corpo"
        apoio="Variações de peso sozinhas não dizem se você avançou. Leia sempre com o resto."
      >
        <label
          htmlFor="peso_kg"
          className="block font-sans text-[13px] font-semibold text-tinta"
        >
          Peso atual (kg)
        </label>
        <input
          id="peso_kg"
          name="peso_kg"
          type="number"
          step="0.1"
          min="1"
          max="499"
          inputMode="decimal"
          placeholder="Ex: 72,4"
          className="mt-1.5 w-full rounded-[10px] border border-linha bg-white px-3 py-2.5 font-sans text-[14px] text-tinta outline-none focus:border-vital"
        />
      </Secao>

      {SECOES.map((secao) => (
        <div key={`bloco-${secao.chave}`}>
        {/* Fotos entram depois de Bem-estar, antes do Fechamento. */}
        {secao.chave === "fechamento" ? <FotosDaSemana token={token} /> : null}
        <Secao titulo={secao.titulo} apoio={secao.apoio}>
          {DIMENSOES.filter((d) => d.secao === secao.chave).map((d) => (
            <Deslizante
              key={d.campo}
              campo={d.campo}
              rotulo={d.rotulo}
              cor={d.cor}
              baixo={d.baixo}
              alto={d.alto}
            />
          ))}

          {secao.chave === "alimentacao" ? <RefeicaoLivre /> : null}

          {secao.chave === "fechamento" ? (
            <>
              <div className="mt-5">
                <label
                  htmlFor="observacoes"
                  className="block font-sans text-[13px] font-semibold text-tinta"
                >
                  O que foi destaque e o que mais atrapalhou essa semana?
                </label>
                <textarea
                  id="observacoes"
                  name="observacoes"
                  rows={3}
                  maxLength={2000}
                  placeholder="Escreva à vontade."
                  className="mt-1.5 w-full resize-y rounded-[10px] border border-linha bg-white px-3 py-2.5 font-sans text-[14px] text-tinta outline-none focus:border-vital"
                />
              </div>

              <button
                type="button"
                onClick={() => setTemAlerta((a) => !a)}
                aria-pressed={temAlerta}
                className="mt-4 flex w-full items-center gap-3 rounded-xl bg-areia-clara px-3.5 py-3 text-left"
              >
                <span
                  className={`relative h-[26px] w-[44px] shrink-0 rounded-full transition ${
                    temAlerta ? "bg-argila" : "bg-[#D8CBB2]"
                  }`}
                >
                  <span
                    className={`absolute top-[3px] h-5 w-5 rounded-full bg-white transition-all ${
                      temAlerta ? "left-[21px]" : "left-[3px]"
                    }`}
                  />
                </span>
                <span>
                  <span className="block font-sans text-[14px] font-semibold text-tinta">
                    Sentiu dor, mal-estar ou algo que te preocupou?
                  </span>
                  <span className="block font-sans text-[12px] text-neutro">
                    Se sim, isso vai direto para o topo da lista da sua nutri.
                  </span>
                </span>
              </button>

              {temAlerta ? (
                <div className="mt-3">
                  <label
                    htmlFor="alerta_clinico"
                    className="block font-sans text-[13px] font-semibold text-tinta"
                  >
                    Conte o que aconteceu
                  </label>
                  <textarea
                    id="alerta_clinico"
                    name="alerta_clinico"
                    rows={2}
                    maxLength={1000}
                    placeholder="Ex: enjoo, refluxo, tontura…"
                    className="mt-1.5 w-full resize-y rounded-[10px] border border-linha bg-white px-3 py-2.5 font-sans text-[14px] text-tinta outline-none focus:border-vital"
                  />
                </div>
              ) : null}
            </>
          ) : null}
        </Secao>
        </div>
      ))}

      {estado.erro ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-argila/35 bg-argila-suave px-4 py-3 font-sans text-sm text-argila"
        >
          {estado.erro}
        </p>
      ) : null}

      <div className="mb-4 rounded-[18px] border border-linha bg-cartao px-[22px] py-5 shadow-cartao">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="consentimento"
            required
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#A9723F]"
          />
          <span className="font-sans text-[13px] leading-relaxed text-neutro">
            Autorizo o uso destas informações de saúde, incluindo as fotos que
            eu enviar, pela nutricionista Larissa Freire, exclusivamente para o
            meu acompanhamento nutricional. Posso pedir a exclusão dos meus
            dados a qualquer momento. Saiba mais na{" "}
            <a
              href="/privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="text-vital-fundo underline underline-offset-2"
            >
              política de privacidade
            </a>
            .
          </span>
        </label>
      </div>

      <div className="mb-8 flex justify-end">
        <BotaoEnviar />
      </div>

      <p className="mb-6 text-center font-mono text-[11px] text-tenue">
        Check-in individual · {token}
      </p>
    </form>
  );
}
