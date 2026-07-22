"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ehFrequencia,
  ehPrioridade,
  ehStatusTarefa,
  proximaData,
  diaDeHoje,
  type Frequencia,
} from "@/lib/trabalho";

export type EstadoTrabalho = { erro?: string };

const CAMINHO = "/painel/trabalho";

function opcional(valor: FormDataEntryValue | null) {
  const texto = String(valor ?? "").trim();
  return texto === "" ? null : texto;
}

// ------------------------------------------------------------
// Tarefas
// ------------------------------------------------------------

function lerTarefa(formData: FormData) {
  const prioridadeBruta = String(formData.get("prioridade") ?? "");
  return {
    titulo: String(formData.get("titulo") ?? "").trim(),
    descricao: opcional(formData.get("descricao")),
    prioridade: ehPrioridade(prioridadeBruta) ? prioridadeBruta : null,
    due_date: opcional(formData.get("due_date")),
    patient_id: opcional(formData.get("patient_id")),
  };
}

export async function criarTarefa(
  _anterior: EstadoTrabalho,
  formData: FormData,
): Promise<EstadoTrabalho> {
  const dados = lerTarefa(formData);
  if (!dados.titulo) return { erro: "O título da tarefa é obrigatório." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("tasks")
    .insert({ ...dados, status: "pendente", owner: user.id });

  if (error) {
    return { erro: `Não foi possível salvar a tarefa. ${error.message}` };
  }

  revalidatePath(CAMINHO);
  return {};
}

export async function atualizarTarefa(
  _anterior: EstadoTrabalho,
  formData: FormData,
): Promise<EstadoTrabalho> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { erro: "Tarefa não identificada." };

  const dados = lerTarefa(formData);
  if (!dados.titulo) return { erro: "O título da tarefa é obrigatório." };

  const statusBruto = String(formData.get("status") ?? "");
  const status = ehStatusTarefa(statusBruto) ? statusBruto : undefined;

  const supabase = await createClient();

  // Reabrir uma tarefa limpa a data de conclusão, senão ela seguiria
  // contando como concluída nos indicadores da semana.
  const extra =
    status === undefined
      ? {}
      : status === "concluída"
        ? { status, completed_at: new Date().toISOString() }
        : { status, completed_at: null };

  const { error } = await supabase
    .from("tasks")
    .update({ ...dados, ...extra })
    .eq("id", id);

  if (error) {
    return { erro: `Não foi possível salvar as alterações. ${error.message}` };
  }

  revalidatePath(CAMINHO);
  return {};
}

export async function alternarTarefa(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const statusAtual = String(formData.get("status") ?? "");
  if (!id) return;

  const concluir = statusAtual === "pendente";

  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update(
      concluir
        ? { status: "concluída", completed_at: new Date().toISOString() }
        : { status: "pendente", completed_at: null },
    )
    .eq("id", id);

  revalidatePath(CAMINHO);
}

export async function excluirTarefa(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", id);

  revalidatePath(CAMINHO);
}

// ------------------------------------------------------------
// Rotinas
// ------------------------------------------------------------

export async function criarRotina(
  _anterior: EstadoTrabalho,
  formData: FormData,
): Promise<EstadoTrabalho> {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const frequenciaBruta = String(formData.get("frequencia") ?? "");

  if (!titulo) return { erro: "O título da rotina é obrigatório." };
  if (!ehFrequencia(frequenciaBruta)) {
    return { erro: "Escolha uma frequência válida." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("routines").insert({
    titulo,
    frequencia: frequenciaBruta,
    // Sem data informada, a rotina começa valendo para hoje.
    next_due: opcional(formData.get("next_due")) ?? diaDeHoje(Date.now()),
    ativa: true,
    owner: user.id,
  });

  if (error) {
    return { erro: `Não foi possível salvar a rotina. ${error.message}` };
  }

  revalidatePath(CAMINHO);
  return {};
}

export async function atualizarRotina(
  _anterior: EstadoTrabalho,
  formData: FormData,
): Promise<EstadoTrabalho> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { erro: "Rotina não identificada." };

  const titulo = String(formData.get("titulo") ?? "").trim();
  const frequenciaBruta = String(formData.get("frequencia") ?? "");

  if (!titulo) return { erro: "O título da rotina é obrigatório." };
  if (!ehFrequencia(frequenciaBruta)) {
    return { erro: "Escolha uma frequência válida." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("routines")
    .update({
      titulo,
      frequencia: frequenciaBruta,
      next_due: opcional(formData.get("next_due")),
    })
    .eq("id", id);

  if (error) {
    return { erro: `Não foi possível salvar as alterações. ${error.message}` };
  }

  revalidatePath(CAMINHO);
  return {};
}

export type EstadoConclusao = { erro?: string; next_due?: string };

/**
 * Marca a rotina como feita e empurra a próxima ocorrência. Recebe os
 * dados direto, para o botão poder chamar com estado otimista, e
 * devolve a nova data ou um erro. O select detecta zero linhas, que
 * antes falharia em silêncio.
 */
export async function concluirRotina(
  id: string,
  frequenciaBruta: string,
  nextDueAtual: string | null,
): Promise<EstadoConclusao> {
  if (!id) return { erro: "Rotina não identificada." };
  if (!ehFrequencia(frequenciaBruta)) return { erro: "Frequência inválida." };

  const hoje = diaDeHoje(Date.now());
  const atual = (nextDueAtual ?? "").trim() || hoje;

  // Parte da data de hoje quando a rotina está atrasada, senão uma
  // rotina diária esquecida por um mês precisaria de trinta cliques
  // para voltar ao presente.
  const base = atual < hoje ? hoje : atual;
  const proxima = proximaData(base, frequenciaBruta as Frequencia);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("routines")
    .update({ next_due: proxima })
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("[trabalho] concluirRotina falhou:", error.message);
    return { erro: "Não foi possível marcar como feita." };
  }
  if (!data || data.length === 0) {
    console.error("[trabalho] concluirRotina não alterou nenhuma linha:", id);
    return { erro: "Não foi possível marcar como feita. Tente novamente." };
  }

  revalidatePath(CAMINHO);
  return { next_due: proxima };
}

export async function alternarRotina(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const ativa = String(formData.get("ativa") ?? "") === "true";
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("routines").update({ ativa: !ativa }).eq("id", id);

  revalidatePath(CAMINHO);
}

export async function excluirRotina(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("routines").delete().eq("id", id);

  revalidatePath(CAMINHO);
}

// ------------------------------------------------------------
// Visão "Hoje": adição rápida, alternar com retorno, adiar, subitens
// ------------------------------------------------------------

export type EstadoTarefaRapida = { erro?: string; id?: string };

/** Cria uma tarefa pelo campo de adição rápida, já com prazo escolhido. */
export async function adicionarRapida(
  titulo: string,
  prioridade: string | null,
  patientId: string | null,
  dueDate: string,
): Promise<EstadoTarefaRapida> {
  const texto = titulo.trim();
  if (!texto) return { erro: "Escreva a tarefa." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      titulo: texto,
      prioridade: ehPrioridade(prioridade ?? "") ? prioridade : null,
      patient_id: patientId || null,
      due_date: dueDate || null,
      status: "pendente",
      owner: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { erro: `Não foi possível criar a tarefa. ${error?.message ?? ""}` };
  }

  revalidatePath(CAMINHO);
  return { id: data.id };
}

/** Alterna concluída, devolvendo o resultado para o check dar feedback. */
export async function alternarTarefaRapida(id: string, concluir: boolean) {
  if (!id) return { erro: "Tarefa não identificada." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update(
      concluir
        ? { status: "concluída", completed_at: new Date().toISOString() }
        : { status: "pendente", completed_at: null },
    )
    .eq("id", id)
    .select("id");

  if (error) {
    console.error("[trabalho] alternarTarefa falhou:", error.message);
    return { erro: "Não foi possível salvar." };
  }
  if (!data || data.length === 0) {
    return { erro: "Não foi possível salvar. Tente novamente." };
  }

  revalidatePath(CAMINHO);
  return {};
}

/** Empurra o prazo da tarefa para outra data. */
export async function adiarTarefa(id: string, novaData: string) {
  if (!id || !novaData) return { erro: "Dados inválidos." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ due_date: novaData })
    .eq("id", id)
    .select("id");

  if (error || !data || data.length === 0) {
    return { erro: "Não foi possível adiar a tarefa." };
  }

  revalidatePath(CAMINHO);
  return {};
}

/** Edita o título da tarefa. */
export async function renomearTarefa(id: string, titulo: string) {
  const texto = titulo.trim();
  if (!id || !texto) return { erro: "O título não pode ficar vazio." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ titulo: texto })
    .eq("id", id)
    .select("id");

  if (error || !data || data.length === 0) {
    return { erro: "Não foi possível salvar o texto." };
  }

  revalidatePath(CAMINHO);
  return {};
}

/** Muda a prioridade da tarefa. */
export async function mudarPrioridade(id: string, prioridade: string | null) {
  if (!id) return { erro: "Tarefa não identificada." };
  const valor = ehPrioridade(prioridade ?? "") ? prioridade : null;

  const supabase = await createClient();
  await supabase.from("tasks").update({ prioridade: valor }).eq("id", id);

  revalidatePath(CAMINHO);
  return {};
}

/**
 * Salva a lista inteira de subitens. O cliente manipula o array e manda
 * o resultado, o que é mais simples que operar dentro do jsonb no banco
 * e evita condição de corrida entre subitens.
 */
export async function salvarSubitens(
  id: string,
  itens: { texto: string; feito: boolean }[],
) {
  if (!id) return { erro: "Tarefa não identificada." };

  // Higieniza: só texto e feito, texto aparado e não vazio, no máximo 50.
  const limpos = (Array.isArray(itens) ? itens : [])
    .map((i) => ({
      texto: String(i?.texto ?? "").trim().slice(0, 300),
      feito: Boolean(i?.feito),
    }))
    .filter((i) => i.texto.length > 0)
    .slice(0, 50);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update({ itens: limpos })
    .eq("id", id)
    .select("id");

  if (error || !data || data.length === 0) {
    return { erro: "Não foi possível salvar o checklist." };
  }

  revalidatePath(CAMINHO);
  return {};
}
