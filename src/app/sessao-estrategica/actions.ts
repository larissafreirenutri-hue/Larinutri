"use server";

import { createClient } from "@/lib/supabase/server";
import {
  OBJETIVOS,
  MODALIDADES_ATENDIMENTO,
  QUANDO_COMECAR,
  daLista,
  observacoesLegiveis,
  type RespostasSessao,
} from "@/lib/sessao";

export type EstadoSessao = { ok?: boolean; erro?: string };

/**
 * Grava o lead da sessão estratégica. A validação também roda aqui, no
 * servidor, porque a checagem no navegador é conveniência, não garantia.
 * O owner e a etapa inicial são decididos pela função no banco, nunca
 * pelo cliente.
 */
export async function enviarSessaoEstrategica(
  bruto: RespostasSessao & { consentimento: boolean },
): Promise<EstadoSessao> {
  const nome = (bruto.nome ?? "").trim();
  if (nome.length < 2) {
    return { erro: "Informe o seu nome para continuar." };
  }

  const whatsapp = (bruto.whatsapp ?? "").trim();
  const digitos = whatsapp.replace(/\D/g, "");
  if (digitos.length < 10 || digitos.length > 13) {
    return { erro: "Informe um WhatsApp válido com DDD, por exemplo 84 99999 9999." };
  }

  const email = (bruto.email ?? "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { erro: "O e-mail informado não parece válido. Confira ou deixe em branco." };
  }

  if (!bruto.consentimento) {
    return { erro: "É preciso aceitar o uso dos dados para enviar." };
  }

  const respostas: RespostasSessao = {
    nome,
    whatsapp,
    email,
    objetivo: daLista(bruto.objetivo, OBJETIVOS),
    modalidade: daLista(bruto.modalidade, MODALIDADES_ATENDIMENTO),
    quando: daLista(bruto.quando, QUANDO_COMECAR),
    tempo: (bruto.tempo ?? "").trim().slice(0, 1000),
    trava: (bruto.trava ?? "").trim().slice(0, 1000),
  };

  const supabase = await createClient();

  // Função SECURITY DEFINER: resolve a dona do sistema e cria o lead
  // já na etapa 'Novo'. O navegador não escolhe o owner.
  const { error } = await supabase.rpc("criar_lead_site", {
    p_nome: nome,
    p_phone: whatsapp,
    p_email: email || null,
    p_observacoes: observacoesLegiveis(respostas),
    p_origem: "Site, sessão estratégica",
  });

  if (error) {
    return {
      erro: "Não foi possível enviar agora. Tente de novo em instantes ou fale no WhatsApp.",
    };
  }

  return { ok: true };
}
