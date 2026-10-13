"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ROTULO_ACESSO, type AcessoStatus } from "@/lib/portal";
import { Selo, CLASSE_BOTAO_SECUNDARIO } from "../../ui";
import { criarAcesso, revogarAcesso, type EstadoAcesso } from "../acesso-actions";

function tomDoStatus(status: AcessoStatus) {
  if (status === "ativo") return "verde" as const;
  if (status === "convidado") return "mel" as const;
  return "neutro" as const;
}

function BotaoGerar({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-vital px-5 py-2.5 font-sans text-[14px] font-semibold text-white shadow-acao transition hover:brightness-105 disabled:opacity-60"
    >
      {pending ? "Gerando..." : rotulo}
    </button>
  );
}

/** Link de primeiro acesso gerado, com copiar e enviar pelo WhatsApp. */
function LinkGerado({
  token,
  nome,
  phone,
}: {
  token: string;
  nome: string;
  phone: string | null;
}) {
  const [copiado, setCopiado] = useState(false);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/primeiro-acesso/${token}`
      : `/primeiro-acesso/${token}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      window.prompt("Copie o link de primeiro acesso:", url);
    }
  }

  const primeiro = nome.split(" ")[0];
  const mensagem = `Oi ${primeiro}! Criei o seu acesso ao portal de acompanhamento. Abra este link para definir a sua senha, ele vale por 3 dias: ${url}`;
  const digitos = (phone ?? "").replace(/\D/g, "");
  const whats =
    digitos.length >= 10
      ? `https://wa.me/${digitos.startsWith("55") ? digitos : `55${digitos}`}?text=${encodeURIComponent(mensagem)}`
      : null;

  return (
    <div className="mt-3 rounded-xl border border-vital/30 bg-vital/5 px-4 py-3">
      <p className="font-sans text-[13px] text-tinta">
        Link de primeiro acesso, válido por 3 dias. Envie para o paciente, ele
        define a própria senha.
      </p>
      <p className="mt-2 break-all font-mono text-[12px] text-neutro">{url}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={copiar} className={CLASSE_BOTAO_SECUNDARIO}>
          {copiado ? "Copiado" : "Copiar link"}
        </button>
        {whats ? (
          <a
            href={whats}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-emerald-600/40 px-4 py-2.5 font-sans text-[14px] text-emerald-700 transition hover:bg-emerald-50"
          >
            Enviar pelo WhatsApp
          </a>
        ) : null}
      </div>
    </div>
  );
}

export function AcessoPortal({
  patientId,
  nome,
  phone,
  acessoStatus,
}: {
  patientId: string;
  nome: string;
  phone: string | null;
  acessoStatus: AcessoStatus;
}) {
  const [estado, acao] = useActionState<EstadoAcesso, FormData>(criarAcesso, {});

  return (
    <div className="rounded-2xl border border-linha bg-cartao px-6 py-5 shadow-cartao">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-[19px] text-barra">
            Acesso ao portal
          </h3>
          <p className="mt-1 font-sans text-[13.5px] text-neutro">
            O paciente acompanha a própria evolução pelo celular, com login e
            senha.
          </p>
        </div>
        <Selo tom={tomDoStatus(acessoStatus)}>
          {ROTULO_ACESSO[acessoStatus]}
        </Selo>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {acessoStatus !== "ativo" ? (
          <form action={acao}>
            <input type="hidden" name="patient_id" value={patientId} />
            <BotaoGerar
              rotulo={
                acessoStatus === "convidado"
                  ? "Gerar novo link"
                  : "Criar acesso ao portal"
              }
            />
          </form>
        ) : null}

        {acessoStatus !== "sem_acesso" ? (
          <form action={revogarAcesso}>
            <input type="hidden" name="patient_id" value={patientId} />
            <button
              type="submit"
              onClick={(e) => {
                const ok = window.confirm(
                  `Revogar o acesso de ${nome.split(" ")[0]}? A conta de login é apagada. O histórico clínico permanece.`,
                );
                if (!ok) e.preventDefault();
              }}
              className="rounded-xl border border-argila/35 px-4 py-2.5 font-sans text-[14px] text-argila transition hover:bg-argila-suave"
            >
              Revogar acesso
            </button>
          </form>
        ) : null}
      </div>

      {estado.erro ? (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-argila/35 bg-argila-suave px-4 py-2.5 font-sans text-[13px] text-argila"
        >
          {estado.erro}
        </p>
      ) : null}

      {estado.token ? (
        <LinkGerado token={estado.token} nome={nome} phone={phone} />
      ) : null}

      {acessoStatus === "ativo" && !estado.token ? (
        <p className="mt-3 font-sans text-[13px] text-neutro">
          O paciente já tem acesso. Se ele esqueceu a senha, pode recuperar em
          Entrar, ou você pode revogar e criar de novo.
        </p>
      ) : null}
    </div>
  );
}
