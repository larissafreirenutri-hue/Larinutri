"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { Lancamento } from "@/lib/financeiro";
import {
  criarLancamento,
  atualizarLancamento,
  type EstadoLancamento,
} from "./actions";

const rotulo = "block font-sans text-sm text-tinta";
const controle =
  "mt-2 w-full rounded-md border border-linha bg-cartao px-4 py-2.5 font-sans text-sm text-tinta placeholder:text-neutro outline-none focus:border-vital focus:ring-1 focus:ring-vital";

function Botao({ texto }: { texto: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-vital px-5 py-2.5 font-sans text-sm font-semibold text-white transition hover:bg-vital/10 disabled:opacity-60"
    >
      {pending ? "Salvando..." : texto}
    </button>
  );
}

export function FormularioLancamento({
  lancamento,
  pacientes,
  hoje,
  onPronto,
}: {
  lancamento?: Lancamento;
  pacientes: { id: string; full_name: string }[];
  hoje: string;
  onPronto?: () => void;
}) {
  const editando = Boolean(lancamento);
  const [estado, acao] = useActionState<EstadoLancamento, FormData>(
    editando ? atualizarLancamento : criarLancamento,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Os campos condicionais precisam reagir na hora, por isso o estado
  // local espelha o que está selecionado.
  const [tipo, setTipo] = useState(lancamento?.tipo ?? "receita");
  const [status, setStatus] = useState(lancamento?.status ?? "pago");

  useEffect(() => {
    if (estado.erro) return;
    if (!editando) formRef.current?.reset();
    onPronto?.();
  }, [estado, editando, onPronto]);

  return (
    <form ref={formRef} action={acao} className="space-y-4">
      {lancamento ? (
        <input type="hidden" name="id" value={lancamento.id} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="tipo" className={rotulo}>
            Tipo <span className="text-vital-fundo">*</span>
          </label>
          <select
            id="tipo"
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as "receita" | "despesa")}
            className={controle}
          >
            <option value="receita" className="bg-cartao">
              Receita
            </option>
            <option value="despesa" className="bg-cartao">
              Despesa
            </option>
          </select>
        </div>

        <div>
          <label htmlFor="valor" className={rotulo}>
            Valor <span className="text-vital-fundo">*</span>
          </label>
          <input
            id="valor"
            name="valor"
            required
            inputMode="decimal"
            defaultValue={
              lancamento?.valor?.toString().replace(".", ",") ?? ""
            }
            placeholder="R$ 0,00"
            className={controle}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="descricao" className={rotulo}>
            Descrição <span className="text-vital-fundo">*</span>
          </label>
          <input
            id="descricao"
            name="descricao"
            required
            defaultValue={lancamento?.descricao ?? ""}
            placeholder="Consulta, aluguel, material..."
            className={controle}
          />
        </div>

        <div>
          <label htmlFor="status" className={rotulo}>
            Situação
          </label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as "pago" | "pendente")}
            className={controle}
          >
            <option value="pago" className="bg-cartao">
              Pago
            </option>
            <option value="pendente" className="bg-cartao">
              Pendente
            </option>
          </select>
        </div>

        {status === "pendente" ? (
          <div>
            <label htmlFor="vencimento" className={rotulo}>
              Vencimento <span className="text-vital-fundo">*</span>
            </label>
            <input
              id="vencimento"
              name="vencimento"
              type="date"
              required
              defaultValue={lancamento?.vencimento ?? hoje}
              className={controle}
            />
          </div>
        ) : null}

        <div>
          <label htmlFor="categoria" className={rotulo}>
            Categoria
          </label>
          <input
            id="categoria"
            name="categoria"
            list="categorias"
            defaultValue={lancamento?.categoria ?? ""}
            placeholder="opcional"
            className={controle}
          />
          <datalist id="categorias">
            <option value="Consulta" />
            <option value="Pacote" />
            <option value="Aluguel" />
            <option value="Material" />
            <option value="Software" />
            <option value="Imposto" />
          </datalist>
        </div>

        {tipo === "receita" ? (
          <div className="sm:col-span-2">
            <label htmlFor="patient_id" className={rotulo}>
              Paciente
            </label>
            <select
              id="patient_id"
              name="patient_id"
              defaultValue={lancamento?.patient_id ?? ""}
              className={controle}
            >
              <option value="" className="bg-cartao">
                Sem vínculo
              </option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id} className="bg-cartao">
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      {estado.erro ? (
        <p
          role="alert"
          className="rounded-md border border-argila/35 bg-argila-suave px-4 py-3 font-sans text-sm text-argila"
        >
          {estado.erro}
        </p>
      ) : null}

      <Botao texto={editando ? "Salvar alterações" : "Adicionar lançamento"} />
    </form>
  );
}

export function NovoLancamento({
  pacientes,
  hoje,
}: {
  pacientes: { id: string; full_name: string }[];
  hoje: string;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="mt-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setAberto((a) => !a)}
          aria-expanded={aberto}
          className="rounded-md bg-vital px-5 py-2.5 font-sans text-sm font-semibold text-white transition hover:bg-vital/10"
        >
          {aberto ? "Fechar" : "Adicionar lançamento"}
        </button>
      </div>

      {aberto ? (
        <div className="mt-6 rounded-xl border border-linha bg-cartao px-6 py-6">
          <h2 className="font-display text-lg text-vital-fundo">Novo lançamento</h2>
          <div className="mt-5">
            <FormularioLancamento pacientes={pacientes} hoje={hoje} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
