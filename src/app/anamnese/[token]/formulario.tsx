"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { SECOES_ANAMNESE, type Pergunta } from "@/lib/anamnese";
import { enviarAnamnese, type EstadoAnamnese } from "./actions";

const campo =
  "mt-2 w-full rounded-[10px] border border-linha bg-white px-3 py-2.5 font-sans text-[14px] text-tinta placeholder:text-tenue outline-none focus:border-vital";

function Rotulo({ p }: { p: Pergunta }) {
  return (
    <span className="block font-sans text-[15px] font-semibold text-tinta">
      {p.rotulo}
      {p.obrigatorio ? <span className="text-vital"> *</span> : null}
    </span>
  );
}

function Escala({ p }: { p: Pergunta }) {
  const min = p.min ?? 1;
  const max = p.max ?? 10;
  const [valor, setValor] = useState(Math.round((min + max) / 2));
  const preenchido = ((valor - min) / (max - min)) * 100;

  return (
    <label className="block">
      <Rotulo p={p} />
      <div className="mt-3 flex items-center gap-4">
        <input
          name={p.chave}
          type="range"
          min={min}
          max={max}
          step={1}
          value={valor}
          onChange={(e) => setValor(Number(e.target.value))}
          className="deslizante w-full"
          style={{
            background: `linear-gradient(90deg, #A9723F ${preenchido}%, #E4D8C2 ${preenchido}%)`,
          }}
        />
        <span className="w-8 shrink-0 text-right font-mono text-[20px] font-bold text-vital-fundo">
          {valor}
        </span>
      </div>
    </label>
  );
}

function Opcoes({ p }: { p: Pergunta }) {
  const [outroAtivo, setOutroAtivo] = useState(false);
  const multipla = p.tipo === "multipla";

  return (
    <fieldset>
      <legend>
        <Rotulo p={p} />
      </legend>

      <div className="mt-3 space-y-2">
        {(p.opcoes ?? []).map((opcao) => (
          <label
            key={opcao}
            className="flex items-center gap-3 rounded-xl border border-linha bg-white px-4 py-2.5"
          >
            <input
              type={multipla ? "checkbox" : "radio"}
              name={p.chave}
              value={opcao}
              className="h-4 w-4 shrink-0 accent-[#A9723F]"
            />
            <span className="font-sans text-[14.5px] text-tinta">{opcao}</span>
          </label>
        ))}

        {p.temOutro ? (
          <div className="rounded-xl border border-linha bg-white px-4 py-2.5">
            <label className="flex items-center gap-3">
              <input
                type={multipla ? "checkbox" : "radio"}
                name={p.chave}
                value="Outro"
                onChange={(e) => setOutroAtivo(e.target.checked)}
                className="h-4 w-4 shrink-0 accent-[#A9723F]"
              />
              <span className="font-sans text-[14.5px] text-tinta">Outro</span>
            </label>
            {outroAtivo ? (
              <input
                name={`${p.chave}_outro`}
                placeholder="Conte qual"
                className={`${campo} mt-2.5`}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </fieldset>
  );
}

function CampoPergunta({ p }: { p: Pergunta }) {
  if (p.tipo === "escala") return <Escala p={p} />;
  if (p.tipo === "unica" || p.tipo === "multipla") return <Opcoes p={p} />;

  if (p.tipo === "textoLongo") {
    return (
      <label className="block">
        <Rotulo p={p} />
        <textarea
          name={p.chave}
          rows={3}
          maxLength={4000}
          required={p.obrigatorio}
          placeholder={p.dica}
          className={`${campo} resize-y`}
        />
      </label>
    );
  }

  return (
    <label className="block">
      <Rotulo p={p} />
      <input
        name={p.chave}
        type={p.tipo === "data" ? "date" : "text"}
        inputMode={p.tipo === "numero" ? "decimal" : undefined}
        maxLength={p.tipo === "data" ? undefined : 500}
        required={p.obrigatorio}
        placeholder={p.dica}
        className={campo}
      />
    </label>
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
      {pending ? "Enviando..." : "Enviar anamnese"}
    </button>
  );
}

export function FormularioAnamnese({
  token,
  primeiroNome,
}: {
  token: string;
  primeiroNome: string;
}) {
  const [estado, acao] = useActionState<EstadoAnamnese, FormData>(
    enviarAnamnese,
    {},
  );

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
          A sua anamnese chegou para a nutricionista. É a partir daqui que ela
          monta o seu plano. Você já pode fechar esta página.
        </p>
      </div>
    );
  }

  return (
    <form action={acao}>
      <input type="hidden" name="token" value={token} />

      <div className="mb-[18px] rounded-[20px] bg-gradient-to-br from-barra to-barra-alta p-[26px]">
        <p className="olho text-dourado">Anamnese inicial</p>
        <h1 className="mt-2 font-display text-[24px] text-sobre-escuro-forte">
          Olá, {primeiroNome}!
        </h1>
        <p className="mt-2 font-sans text-[14.5px] leading-relaxed text-sobre-escuro-suave">
          Este é o seu formulário inicial. Ele é respondido uma vez, e é a base
          de todo o acompanhamento. Responda com calma e sinceridade, é isso que
          deixa o seu plano com a sua cara. Os campos com asterisco são
          obrigatórios.
        </p>
      </div>

      {SECOES_ANAMNESE.map((secao) => (
        <section
          key={secao.chave}
          className="mb-4 rounded-[18px] border border-linha bg-cartao p-[22px] shadow-cartao"
        >
          <h2 className="font-display text-[19px] text-barra">{secao.titulo}</h2>
          <p className="mb-5 mt-[3px] font-sans text-[13px] text-neutro">
            {secao.apoio}
          </p>

          <div className="space-y-5">
            {secao.perguntas.map((p) => (
              <CampoPergunta key={p.chave} p={p} />
            ))}
          </div>
        </section>
      ))}

      <div className="mb-4 rounded-[18px] border border-linha bg-cartao px-[22px] py-5 shadow-cartao">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="consentimento"
            required
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#A9723F]"
          />
          <span className="font-sans text-[13px] leading-relaxed text-neutro">
            Autorizo o uso destas informações de saúde pela nutricionista
            Larissa Freire, exclusivamente para o meu acompanhamento
            nutricional. Posso pedir a exclusão dos meus dados a qualquer
            momento. Saiba mais na{" "}
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

      {estado.erro ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-argila/35 bg-argila-suave px-4 py-3 font-sans text-sm text-argila"
        >
          {estado.erro}
        </p>
      ) : null}

      <div className="mb-8 flex justify-end">
        <BotaoEnviar />
      </div>

      <p className="mb-6 text-center font-mono text-[11px] text-tenue">
        Anamnese individual · {token}
      </p>
    </form>
  );
}
