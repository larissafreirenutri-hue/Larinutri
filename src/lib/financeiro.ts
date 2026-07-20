export const TIPOS = ["receita", "despesa"] as const;
export const STATUS = ["pago", "pendente"] as const;

export type Tipo = (typeof TIPOS)[number];
export type Status = (typeof STATUS)[number];

export function ehTipo(v: string): v is Tipo {
  return (TIPOS as readonly string[]).includes(v);
}
export function ehStatus(v: string): v is Status {
  return (STATUS as readonly string[]).includes(v);
}

export type Lancamento = {
  id: string;
  owner: string;
  tipo: Tipo;
  descricao: string;
  valor: number;
  categoria: string | null;
  patient_id: string | null;
  status: Status;
  vencimento: string | null;
  pago_em: string | null;
  created_at: string;
  patients?: { id: string; full_name: string } | null;
};

const FUSO = "America/Sao_Paulo";

const CHAVE_MES = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  timeZone: FUSO,
});

const DIA_SP = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: FUSO,
});

const ROTULO_MES = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  timeZone: FUSO,
});

/** "2026-07", sempre no fuso de Brasília. */
export function chaveMes(momento: number | string) {
  return CHAVE_MES.format(new Date(momento));
}

/** "2026-07-19", usado para comparar com o campo date de vencimento. */
export function diaDeHoje(agora: number) {
  return DIA_SP.format(new Date(agora));
}

/**
 * A data que conta para o caixa. Um lançamento pago carrega pago_em,
 * mas se ele foi cadastrado já como pago sem informar a data, cai no
 * created_at, senão sumiria dos relatórios.
 */
export function dataEfetiva(l: Lancamento) {
  return l.pago_em ?? l.created_at;
}

export type MesResumo = { chave: string; rotulo: string; valor: number };

/** Os últimos n meses, do mais antigo ao mais recente. */
export function ultimosMeses(agora: number, n = 6): MesResumo[] {
  const base = new Date(agora);
  const meses: MesResumo[] = [];

  for (let i = n - 1; i >= 0; i--) {
    // Dia 15 evita que o recuo de mês tropece em dia 31.
    const d = new Date(
      Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - i, 15, 12),
    );
    meses.push({
      chave: chaveMes(d.getTime()),
      rotulo: ROTULO_MES.format(d).replace(".", ""),
      valor: 0,
    });
  }

  return meses;
}

export type ResumoFinanceiro = {
  receitaRecebida: number;
  aReceber: number;
  atrasado: number;
  atrasadosQtd: number;
  despesasPagas: number;
  resultado: number;
  porMes: MesResumo[];
};

export function resumirFinanceiro(
  lancamentos: Lancamento[],
  agora = Date.now(),
): ResumoFinanceiro {
  const mesAtual = chaveMes(agora);
  const hoje = diaDeHoje(agora);

  const receitas = lancamentos.filter((l) => l.tipo === "receita");
  const despesas = lancamentos.filter((l) => l.tipo === "despesa");

  const receitaRecebida = receitas
    .filter(
      (l) => l.status === "pago" && chaveMes(dataEfetiva(l)) === mesAtual,
    )
    .reduce((s, l) => s + l.valor, 0);

  const despesasPagas = despesas
    .filter(
      (l) => l.status === "pago" && chaveMes(dataEfetiva(l)) === mesAtual,
    )
    .reduce((s, l) => s + l.valor, 0);

  const pendentes = receitas.filter((l) => l.status === "pendente");

  // Comparação entre strings YYYY-MM-DD é segura e evita o vaivém de
  // fuso que uma conversão para Date traria.
  const atrasados = pendentes.filter(
    (l) => l.vencimento !== null && l.vencimento < hoje,
  );

  const porMes = ultimosMeses(agora, 6);
  const indice = new Map(porMes.map((m, i) => [m.chave, i]));

  for (const l of receitas) {
    if (l.status !== "pago") continue;
    const i = indice.get(chaveMes(dataEfetiva(l)));
    if (i !== undefined) porMes[i].valor += l.valor;
  }

  return {
    receitaRecebida,
    aReceber: pendentes.reduce((s, l) => s + l.valor, 0),
    atrasado: atrasados.reduce((s, l) => s + l.valor, 0),
    atrasadosQtd: atrasados.length,
    despesasPagas,
    resultado: receitaRecebida - despesasPagas,
    porMes,
  };
}

/** Marca cada lançamento como atrasado, para a lista destacar. */
export function marcarAtrasados(
  lancamentos: Lancamento[],
  agora = Date.now(),
) {
  const hoje = diaDeHoje(agora);
  return lancamentos.map((l) => ({
    ...l,
    atrasado:
      l.status === "pendente" &&
      l.vencimento !== null &&
      l.vencimento < hoje,
  }));
}

export type LancamentoNaLista = ReturnType<typeof marcarAtrasados>[number];
