"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { enviarCheckin, type EstadoCheckin } from "./actions";

const rotuloCampo = "block font-sans text-sm text-creme/80";
const baseControle =
  "mt-2 w-full rounded-md border border-dourado/30 bg-creme/5 px-4 py-2.5 font-sans text-sm text-creme outline-none focus:border-dourado focus:ring-1 focus:ring-dourado";

function Selecao({
  id,
  rotulo,
  opcoes,
}: {
  id: string;
  rotulo: string;
  opcoes: string[];
}) {
  return (
    <div>
      <label htmlFor={id} className={rotuloCampo}>
        {rotulo}
      </label>
      <select id={id} name={id} defaultValue="" className={baseControle}>
        <option value="">Prefiro não responder</option>
        {opcoes.map((opcao) => (
          <option key={opcao} value={opcao} className="bg-marrom">
            {opcao}
          </option>
        ))}
      </select>
    </div>
  );
}

function BotaoEnviar() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-dourado px-5 py-3 font-sans text-sm font-semibold text-marrom transition hover:bg-dourado/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Enviando..." : "Enviar check-in"}
    </button>
  );
}

export function FormularioCheckin({
  token,
  primeiroNome,
}: {
  token: string;
  primeiroNome: string;
}) {
  const [estado, acao] = useActionState<EstadoCheckin, FormData>(
    enviarCheckin,
    {},
  );

  // Tela de agradecimento substitui o formulário por completo, então
  // não existe botão para reenviar sem recarregar a página.
  if (estado.ok) {
    return (
      <div className="rounded-2xl border border-dourado/30 bg-marrom px-6 py-12 text-center text-creme">
        <p className="font-display text-2xl text-dourado">
          Check-in enviado, obrigado
        </p>
        <p className="mt-4 font-sans text-sm leading-relaxed text-creme/70">
          Suas respostas chegaram para a Larissa. Ela vai revisar antes da
          próxima consulta. Você já pode fechar esta página.
        </p>
      </div>
    );
  }

  return (
    <form action={acao} className="space-y-5 rounded-2xl bg-marrom p-6 text-creme">
      <input type="hidden" name="token" value={token} />

      <p className="font-sans text-sm leading-relaxed text-creme/65">
        Olá, {primeiroNome}. Responda o que fizer sentido para você, todos os
        campos são opcionais.
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="peso_kg" className={rotuloCampo}>
            Peso atual, em quilos
          </label>
          <input
            id="peso_kg"
            name="peso_kg"
            type="number"
            step="0.1"
            min="1"
            max="499"
            inputMode="decimal"
            placeholder="opcional"
            className={`${baseControle} placeholder:text-creme/35`}
          />
        </div>

        <div>
          <label htmlFor="dias_atividade_fisica" className={rotuloCampo}>
            Dias de atividade física na semana
          </label>
          <input
            id="dias_atividade_fisica"
            name="dias_atividade_fisica"
            type="number"
            step="1"
            min="0"
            max="7"
            inputMode="numeric"
            placeholder="de 0 a 7"
            className={`${baseControle} placeholder:text-creme/35`}
          />
        </div>
      </div>

      <Selecao
        id="adesao_plano"
        rotulo="Como foi a sua adesão ao plano alimentar"
        opcoes={["Baixa", "Média", "Alta"]}
      />

      <Selecao
        id="qualidade_sono"
        rotulo="Como está a qualidade do seu sono"
        opcoes={["Ruim", "Regular", "Boa", "Ótima"]}
      />

      <Selecao
        id="nivel_fome"
        rotulo="Como esteve o seu nível de fome"
        opcoes={["Baixa", "Moderada", "Alta"]}
      />

      <div>
        <label htmlFor="observacoes" className={rotuloCampo}>
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          rows={4}
          maxLength={2000}
          placeholder="Conte como foi a sua semana, dificuldades, conquistas, o que quiser."
          className={`${baseControle} resize-y placeholder:text-creme/35`}
        />
      </div>

      <label className="flex items-start gap-3 rounded-md border border-dourado/25 bg-creme/5 px-4 py-4">
        <input
          type="checkbox"
          name="consentimento"
          required
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#E0C7A0]"
        />
        <span className="font-sans text-xs leading-relaxed text-creme/70">
          Autorizo o uso destas informações de saúde pela nutricionista Larissa
          Freire, exclusivamente para o meu acompanhamento nutricional. Posso
          pedir a exclusão dos meus dados a qualquer momento. Saiba mais na{" "}
          <a
            href="/privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="text-dourado underline underline-offset-2 transition hover:text-dourado/80"
          >
            política de privacidade
          </a>
          .
        </span>
      </label>

      {estado.erro ? (
        <p
          role="alert"
          className="rounded-md border border-red-300/40 bg-red-900/20 px-4 py-3 font-sans text-sm text-red-100"
        >
          {estado.erro}
        </p>
      ) : null}

      <BotaoEnviar />
    </form>
  );
}
