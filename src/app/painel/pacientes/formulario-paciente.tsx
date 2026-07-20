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
      className="rounded-md bg-vital px-5 py-2.5 font-sans text-sm font-semibold text-white transition hover:bg-vital/10 disabled:cursor-not-allowed disabled:opacity-60"
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

      <div className="border-t border-linha pt-5">
        <p className="olho">Plano e acompanhamento</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Campo id="objetivo" rotulo="Objetivo" padrao={paciente?.objetivo} dica="Recomposição corporal" />
          <Campo id="restricao" rotulo="Restrições" padrao={paciente?.restricao} dica="Sem lactose" />
          <Campo id="plano_nome" rotulo="Plano" padrao={paciente?.plano_nome} dica="Platinum" />
          <Campo id="plano_duracao" rotulo="Duração do plano" padrao={paciente?.plano_duracao} dica="6 meses" />
          <Campo id="plano_vence" rotulo="Vence em" tipo="date" padrao={paciente?.plano_vence} />
          <Campo id="peso_inicial" rotulo="Peso inicial, em kg" padrao={paciente?.peso_inicial?.toString().replace(".", ",")} dica="88,2" />
          <Campo id="altura" rotulo="Altura, em metros" padrao={paciente?.altura?.toString().replace(".", ",")} dica="1,67" />
          <Campo id="sono_habitual" rotulo="Sono habitual" padrao={paciente?.sono_habitual} dica="7 a 8h, dorme ~23h" />
          <Campo id="treino_planejado" rotulo="Treino planejado" padrao={paciente?.treino_planejado} dica="4x / semana" />
          <Campo id="meta_agua" rotulo="Meta de água" padrao={paciente?.meta_agua} dica="3 L / dia" />
        </div>
      </div>

      {estado.erro ? (
        <p
          role="alert"
          className="rounded-md border border-argila/35 bg-argila-suave px-4 py-3 font-sans text-sm text-argila"
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
