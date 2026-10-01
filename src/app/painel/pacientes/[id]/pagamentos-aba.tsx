"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { formatarData, formatarMoeda } from "@/lib/formato";
import type { Lancamento } from "@/lib/financeiro";
import {
  resumirPlano,
  MODALIDADES,
  ROTULO_MODALIDADE,
  type PlanoPagamento,
} from "@/lib/planos";
import { fimDoPlano, diasEntre, type Retorno } from "@/lib/retornos";
import { Cartao, Selo, Vazio } from "../../ui";
import {
  marcarComoPago,
  atualizarPagamento,
} from "../../financeiro/actions";
import {
  criarPlano,
  cancelarPlano,
  editarPlano,
  type EstadoPlano,
} from "../../financeiro/planos-actions";
import {
  marcarRetornoRealizado,
  remarcarRetorno,
} from "../../financeiro/retornos-actions";

const campo =
  "mt-1.5 w-full rounded-[10px] border border-linha bg-white px-3 py-2.5 font-sans text-[14px] text-tinta outline-none focus:border-vital";
const rotulo = "block font-sans text-[13px] font-semibold text-tinta";

function BotaoSalvar({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-vital px-5 py-2.5 font-sans text-[15px] font-semibold text-white shadow-acao transition hover:brightness-105 disabled:opacity-60"
    >
      {pending ? "Salvando..." : children}
    </button>
  );
}

/** Botão que revela um campo de data e confirma o pagamento. */
function MarcarPaga({
  id,
  hoje,
  rotulo: texto = "Marcar paga",
}: {
  id: string;
  hoje: string;
  rotulo?: string;
}) {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="rounded-md border border-emerald-600/40 px-3 py-1.5 font-sans text-xs text-emerald-700 transition hover:bg-emerald-50"
      >
        {texto}
      </button>
    );
  }

  return (
    <form action={marcarComoPago} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <label className="font-sans text-xs text-neutro">
        Pago em
        <input
          type="date"
          name="pago_em"
          defaultValue={hoje}
          className="ml-2 rounded-md border border-linha bg-white px-2 py-1 font-sans text-xs text-tinta outline-none focus:border-vital"
        />
      </label>
      <button
        type="submit"
        className="rounded-md bg-emerald-600 px-3 py-1.5 font-sans text-xs font-semibold text-white transition hover:brightness-105"
      >
        Confirmar
      </button>
    </form>
  );
}

/** Corrige a data de um pagamento já registrado. */
function CorrigirData({ id, pagoEm }: { id: string; pagoEm: string }) {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="font-sans text-xs text-vital-fundo underline underline-offset-2 transition hover:text-vital"
      >
        corrigir data
      </button>
    );
  }

  return (
    <form
      action={atualizarPagamento}
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="id" value={id} />
      <input
        type="date"
        name="pago_em"
        defaultValue={pagoEm}
        className="rounded-md border border-linha bg-white px-2 py-1 font-sans text-xs text-tinta outline-none focus:border-vital"
      />
      <button
        type="submit"
        className="rounded-md border border-linha px-3 py-1 font-sans text-xs text-vital-fundo transition hover:bg-vital/10"
      >
        Salvar data
      </button>
    </form>
  );
}

/** Marca um retorno como realizado, com a data real editável. */
function MarcarRetorno({
  id,
  patientId,
  hoje,
}: {
  id: string;
  patientId: string;
  hoje: string;
}) {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="rounded-md border border-emerald-600/40 px-3 py-1.5 font-sans text-xs text-emerald-700 transition hover:bg-emerald-50"
      >
        Marcar realizado
      </button>
    );
  }

  return (
    <form
      action={marcarRetornoRealizado}
      className="flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="patient_id" value={patientId} />
      <label className="font-sans text-xs text-neutro">
        Em
        <input
          type="date"
          name="realizado_em"
          defaultValue={hoje}
          className="ml-1.5 rounded-md border border-linha bg-white px-2 py-1 font-sans text-xs text-tinta outline-none focus:border-vital"
        />
      </label>
      <button
        type="submit"
        className="rounded-md bg-emerald-600 px-3 py-1.5 font-sans text-xs font-semibold text-white transition hover:brightness-105"
      >
        Confirmar
      </button>
    </form>
  );
}

/** Remarca um retorno para outra data prevista. */
function RemarcarRetorno({
  id,
  patientId,
  data,
}: {
  id: string;
  patientId: string;
  data: string;
}) {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="font-sans text-xs text-vital-fundo underline underline-offset-2 transition hover:text-vital"
      >
        remarcar
      </button>
    );
  }

  return (
    <form action={remarcarRetorno} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="patient_id" value={patientId} />
      <input
        type="date"
        name="data_prevista"
        defaultValue={data}
        className="rounded-md border border-linha bg-white px-2 py-1 font-sans text-xs text-tinta outline-none focus:border-vital"
      />
      <button
        type="submit"
        className="rounded-md border border-linha px-3 py-1 font-sans text-xs text-vital-fundo transition hover:bg-vital/10"
      >
        Salvar data
      </button>
    </form>
  );
}

function FormularioNovoPlano({
  patientId,
  hoje,
}: {
  patientId: string;
  hoje: string;
}) {
  const [estado, acao] = useActionState<EstadoPlano, FormData>(criarPlano, {});
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="rounded-xl bg-vital px-5 py-2.5 font-sans text-[15px] font-semibold text-white shadow-acao transition hover:brightness-105"
      >
        Novo plano de pagamento
      </button>
    );
  }

  return (
    <Cartao className="px-6 py-5">
      <h3 className="font-display text-[19px] text-barra">
        Novo plano de pagamento
      </h3>
      <form action={acao} className="mt-4 grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="patient_id" value={patientId} />

        <div className="sm:col-span-2">
          <label htmlFor="descricao" className={rotulo}>
            Descrição
          </label>
          <input
            id="descricao"
            name="descricao"
            placeholder="Ex: Plano trimestral"
            className={campo}
          />
        </div>

        <div>
          <label htmlFor="valor_mensal" className={rotulo}>
            Valor mensal
          </label>
          <input
            id="valor_mensal"
            name="valor_mensal"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="Ex: 219,90"
            className={campo}
          />
        </div>

        <div>
          <label htmlFor="meses" className={rotulo}>
            Quantidade de meses
          </label>
          <input
            id="meses"
            name="meses"
            type="number"
            min={1}
            max={60}
            defaultValue={6}
            className={campo}
          />
        </div>

        <div>
          <label htmlFor="dia_vencimento" className={rotulo}>
            Dia do vencimento
          </label>
          <input
            id="dia_vencimento"
            name="dia_vencimento"
            type="number"
            min={1}
            max={28}
            placeholder="1 a 28"
            className={campo}
          />
        </div>

        <div>
          <label htmlFor="data_inicio" className={rotulo}>
            Data de início
          </label>
          <input
            id="data_inicio"
            name="data_inicio"
            type="date"
            defaultValue={hoje}
            className={campo}
          />
        </div>

        <div>
          <label htmlFor="modalidade" className={rotulo}>
            Modalidade
          </label>
          <select id="modalidade" name="modalidade" className={campo} defaultValue="">
            <option value="">Não informar</option>
            {MODALIDADES.map((m) => (
              <option key={m} value={m}>
                {ROTULO_MODALIDADE[m]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="qtd_retornos" className={rotulo}>
            Retornos inclusos
          </label>
          <input
            id="qtd_retornos"
            name="qtd_retornos"
            type="number"
            min={0}
            max={24}
            defaultValue={0}
            className={campo}
          />
          <p className="mt-1 font-sans text-[12px] text-neutro">
            O sistema distribui as datas ao longo do plano, o último antes do
            fim.
          </p>
        </div>

        {estado.erro ? (
          <p
            role="alert"
            className="sm:col-span-2 rounded-xl border border-argila/35 bg-argila-suave px-4 py-2.5 font-sans text-[13px] text-argila"
          >
            {estado.erro}
          </p>
        ) : null}

        <div className="sm:col-span-2 flex items-center gap-3">
          <BotaoSalvar>Criar plano e gerar parcelas</BotaoSalvar>
          <button
            type="button"
            onClick={() => setAberto(false)}
            className="font-sans text-[14px] text-neutro transition hover:text-tinta"
          >
            Cancelar
          </button>
        </div>
      </form>
    </Cartao>
  );
}

function FormularioEditarPlano({
  plano,
  onPronto,
}: {
  plano: PlanoPagamento;
  onPronto: () => void;
}) {
  const [estado, acao] = useActionState<EstadoPlano, FormData>(editarPlano, {});
  if (estado.ok) onPronto();

  return (
    <form action={acao} className="mt-4 grid gap-3 border-t border-linha pt-4 sm:grid-cols-2">
      <input type="hidden" name="id" value={plano.id} />
      <input type="hidden" name="patient_id" value={plano.patient_id ?? ""} />
      <div>
        <label className={rotulo}>Descrição</label>
        <input
          name="descricao"
          defaultValue={plano.descricao ?? ""}
          placeholder="Ex: Plano trimestral"
          className={campo}
        />
      </div>
      <div>
        <label className={rotulo}>Valor mensal</label>
        <input
          name="valor_mensal"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          defaultValue={String(plano.valor_mensal).replace(".", ",")}
          className={campo}
        />
      </div>
      <p className="sm:col-span-2 font-sans text-[12px] text-neutro">
        O novo valor vale para as parcelas ainda não pagas. O que já foi pago
        não muda.
      </p>
      {estado.erro ? (
        <p role="alert" className="sm:col-span-2 font-sans text-[13px] text-argila">
          {estado.erro}
        </p>
      ) : null}
      <div className="sm:col-span-2 flex items-center gap-3">
        <BotaoSalvar>Salvar plano</BotaoSalvar>
        <button
          type="button"
          onClick={onPronto}
          className="font-sans text-[14px] text-neutro transition hover:text-tinta"
        >
          Fechar
        </button>
      </div>
    </form>
  );
}

function Resumo({ rotulo: r, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl bg-areia-clara px-4 py-3">
      <p className="olho">{r}</p>
      <p className="mt-1 font-sans text-[16px] font-semibold text-tinta">
        {valor}
      </p>
    </div>
  );
}

function CartaoPlano({
  plano,
  parcelas,
  retornos,
  hoje,
}: {
  plano: PlanoPagamento;
  parcelas: Lancamento[];
  retornos: Retorno[];
  hoje: string;
}) {
  const [editando, setEditando] = useState(false);
  const resumo = resumirPlano(parcelas, plano.valor_mensal, plano.meses);

  const fim = fimDoPlano(plano.data_inicio, plano.meses);
  const diasParaFim = diasEntre(hoje, fim);
  // Perto do fim, entre hoje e 21 dias, é hora da conversa de renovação.
  const perto = plano.status === "ativo" && diasParaFim >= 0 && diasParaFim <= 21;

  const selo =
    plano.status === "concluido"
      ? { tom: "vital" as const, texto: "concluído" }
      : plano.status === "cancelado"
        ? { tom: "argila" as const, texto: "cancelado" }
        : { tom: "mel" as const, texto: "ativo" };

  return (
    <Cartao className="px-6 py-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="font-display text-[20px] text-barra">
              {plano.descricao || "Plano de pagamento"}
            </h3>
            <Selo tom={selo.tom}>{selo.texto}</Selo>
          </div>
          <p className="mt-1 font-sans text-[14px] text-neutro">
            {formatarMoeda(plano.valor_mensal)} por mês, {plano.meses}{" "}
            {plano.meses === 1 ? "parcela" : "parcelas"}
            {plano.modalidade
              ? `, ${ROTULO_MODALIDADE[plano.modalidade].toLowerCase()}`
              : ""}
            , início em {formatarData(plano.data_inicio)}
          </p>
          <p
            className={`mt-1 font-sans text-[13px] ${
              perto ? "font-semibold text-argila" : "text-neutro"
            }`}
          >
            {plano.status === "concluido"
              ? `encerrou em ${formatarData(fim)}`
              : `termina em ${formatarData(fim)}`}
            {perto
              ? diasParaFim === 0
                ? ", é hoje, hora de falar de renovação"
                : `, em ${diasParaFim} ${diasParaFim === 1 ? "dia" : "dias"}, hora de falar de renovação`
              : ""}
          </p>
        </div>

        {plano.status === "ativo" ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditando((v) => !v)}
              className="rounded-md border border-linha px-3 py-1.5 font-sans text-xs text-vital-fundo transition hover:bg-vital/10"
            >
              {editando ? "Fechar" : "Editar"}
            </button>
            <form action={cancelarPlano}>
              <input type="hidden" name="id" value={plano.id} />
              <input
                type="hidden"
                name="patient_id"
                value={plano.patient_id ?? ""}
              />
              <button
                type="submit"
                onClick={(e) => {
                  const ok = window.confirm(
                    "Cancelar este plano? As parcelas ainda não pagas serão removidas. As já pagas ficam no histórico.",
                  );
                  if (!ok) e.preventDefault();
                }}
                className="rounded-md border border-argila/35 px-3 py-1.5 font-sans text-xs text-argila transition hover:bg-argila-suave"
              >
                Cancelar plano
              </button>
            </form>
          </div>
        ) : null}
      </header>

      {editando ? (
        <FormularioEditarPlano plano={plano} onPronto={() => setEditando(false)} />
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Resumo rotulo="Total" valor={formatarMoeda(resumo.total) ?? "R$ 0,00"} />
        <Resumo
          rotulo="Já recebido"
          valor={formatarMoeda(resumo.recebido) ?? "R$ 0,00"}
        />
        <Resumo
          rotulo="A receber"
          valor={formatarMoeda(resumo.aReceber) ?? "R$ 0,00"}
        />
        <Resumo
          rotulo="Parcelas pagas"
          valor={`${resumo.pagasQtd} de ${plano.meses}`}
        />
      </div>

      {retornos.length > 0 ? (
        <div className="mt-5 rounded-xl border border-linha px-4 py-3">
          <p className="olho">Retornos</p>
          <ul className="mt-2 divide-y divide-linha">
            {retornos.map((r) => {
              const atrasado = r.status === "pendente" && r.data_prevista < hoje;
              return (
                <li
                  key={r.id}
                  className={`flex flex-wrap items-center justify-between gap-2 py-2.5 ${
                    atrasado ? "text-argila" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-sans text-[14px] text-tinta">
                      Retorno {r.numero} de {plano.qtd_retornos}
                      <span className="ml-2 font-sans text-[12.5px] text-neutro">
                        {r.status === "realizado" && r.realizado_em
                          ? `realizado em ${formatarData(r.realizado_em)}`
                          : `previsto ${formatarData(r.data_prevista)}`}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <span
                      className={`rounded px-2 py-0.5 font-sans text-[10px] uppercase tracking-wider ${
                        atrasado
                          ? "bg-argila-suave text-argila"
                          : r.status === "realizado"
                            ? "bg-areia text-neutro"
                            : "bg-vital/10 text-vital-fundo"
                      }`}
                    >
                      {atrasado ? "atrasado" : r.status}
                    </span>
                    {r.status !== "realizado" ? (
                      <>
                        <MarcarRetorno
                          id={r.id}
                          patientId={plano.patient_id ?? ""}
                          hoje={hoje}
                        />
                        <RemarcarRetorno
                          id={r.id}
                          patientId={plano.patient_id ?? ""}
                          data={r.data_prevista}
                        />
                      </>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <ul className="mt-5 divide-y divide-linha">
        {parcelas.map((p) => {
          const atrasada =
            p.status !== "pago" &&
            p.vencimento !== null &&
            p.vencimento < hoje;

          return (
            <li
              key={p.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-lg px-3 py-3 ${
                atrasada ? "bg-argila-suave" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="font-sans text-[14.5px] font-medium text-tinta">
                  Parcela {p.parcela_num} de {plano.meses}
                  <span className="ml-2 font-sans text-[13px] font-normal text-neutro tabular-nums">
                    {formatarMoeda(p.valor)}
                  </span>
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 font-sans text-[12.5px] text-neutro">
                  <span>
                    vence {p.vencimento ? formatarData(p.vencimento) : "sem data"}
                  </span>
                  {p.status === "pago" && p.pago_em ? (
                    <span className="text-emerald-700">
                      pago em {formatarData(p.pago_em)}
                    </span>
                  ) : null}
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <span
                  className={`rounded px-2 py-0.5 font-sans text-[10px] uppercase tracking-wider ${
                    atrasada
                      ? "bg-argila-suave text-argila"
                      : p.status === "pago"
                        ? "bg-areia text-neutro"
                        : "bg-vital/10 text-vital-fundo"
                  }`}
                >
                  {atrasada ? "atrasada" : p.status === "pago" ? "paga" : "pendente"}
                </span>

                {p.status === "pago" && p.pago_em ? (
                  <CorrigirData id={p.id} pagoEm={p.pago_em} />
                ) : (
                  <MarcarPaga id={p.id} hoje={hoje} />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Cartao>
  );
}

export function AbaPagamentos({
  patientId,
  planos,
  parcelas,
  retornos,
  hoje,
}: {
  patientId: string;
  planos: PlanoPagamento[];
  parcelas: Lancamento[];
  retornos: Retorno[];
  hoje: string;
}) {
  const parcelasDoPlano = (planoId: string) =>
    parcelas
      .filter((p) => p.payment_plan_id === planoId)
      .sort((a, b) => (a.parcela_num ?? 0) - (b.parcela_num ?? 0));

  const retornosDoPlano = (planoId: string) =>
    retornos
      .filter((r) => r.payment_plan_id === planoId)
      .sort((a, b) => a.numero - b.numero);

  return (
    <div className="mt-6 space-y-5">
      <FormularioNovoPlano patientId={patientId} hoje={hoje} />

      {planos.length === 0 ? (
        <Vazio
          titulo="Nenhum plano de pagamento"
          texto="Crie um plano recorrente e o sistema gera as parcelas mês a mês, com vencimento e controle do pagamento."
        />
      ) : (
        planos.map((plano) => (
          <CartaoPlano
            key={plano.id}
            plano={plano}
            parcelas={parcelasDoPlano(plano.id)}
            retornos={retornosDoPlano(plano.id)}
            hoje={hoje}
          />
        ))
      )}
    </div>
  );
}
