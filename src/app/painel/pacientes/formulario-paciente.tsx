"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { Paciente } from "@/lib/tipos";
import { Campo, CampoTexto } from "./campos";
import {
  criarPaciente,
  atualizarPaciente,
  type EstadoPaciente,
} from "./actions";

function BotaoSalvar({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-dourado px-5 py-2.5 font-sans text-sm font-semibold text-marrom transition hover:bg-dourado/90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Salvando..." : rotulo}
    </button>
  );
}

export function FormularioPaciente({
  paciente,
  onCancelar,
}: {
  paciente?: Paciente;
  onCancelar?: React.ReactNode;
}) {
  const editando = Boolean(paciente);
  const [estado, acao] = useActionState<EstadoPaciente, FormData>(
    editando ? atualizarPaciente : criarPaciente,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Ao criar com sucesso, a action volta sem erro e a lista revalida.
  // Limpar o formulário deixa a Larissa emendar o próximo cadastro.
  useEffect(() => {
    if (!editando && !estado.erro) {
      formRef.current?.reset();
    }
  }, [estado, editando]);

  return (
    <form ref={formRef} action={acao} className="space-y-4">
      {paciente ? <input type="hidden" name="id" value={paciente.id} /> : null}

      <Campo
        id="full_name"
        rotulo="Nome completo"
        obrigatorio
        padrao={paciente?.full_name}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          id="email"
          rotulo="E-mail"
          tipo="email"
          padrao={paciente?.email}
          dica="opcional"
        />
        <Campo
          id="phone"
          rotulo="Telefone ou WhatsApp"
          tipo="tel"
          padrao={paciente?.phone}
          dica="opcional"
        />
      </div>

      <CampoTexto
        id="notes"
        rotulo="Observações"
        padrao={paciente?.notes}
        dica="opcional"
      />

      {estado.erro ? (
        <p
          role="alert"
          className="rounded-md border border-red-300/40 bg-red-900/20 px-4 py-3 font-sans text-sm text-red-100"
        >
          {estado.erro}
        </p>
      ) : null}

      <div className="flex items-center gap-3 pt-1">
        <BotaoSalvar rotulo={editando ? "Salvar alterações" : "Adicionar"} />
        {onCancelar}
      </div>
    </form>
  );
}
