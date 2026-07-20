import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { agora } from "@/lib/visao-geral";
import { TituloPagina } from "../ui";
import { Quadro, type CartaoCheckin, type CartaoPendente } from "./quadro";

export const metadata: Metadata = {
  title: "Esteira, Larissa Freire Nutricionista",
};

export default async function EsteiraPage() {
  const supabase = await createClient();
  const momento = agora();

  // O RLS limita as duas consultas às linhas desta nutricionista.
  const [checkinsRes, linksRes] = await Promise.all([
    supabase
      .from("checkins")
      .select("id, patient_id, created_at, semana_geral, alerta_clinico, triagem, patients(full_name)")
      .neq("triagem", "a_responder")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("checkin_links")
      .select("id, patient_id, gerado_em, expira_em, status, patients(full_name)")
      .in("status", ["gerado", "enviado"])
      .order("gerado_em", { ascending: false }),
  ]);

  const erro = checkinsRes.error ?? linksRes.error;

  type LinhaCheckin = {
    id: string;
    patient_id: string;
    created_at: string;
    semana_geral: number | null;
    alerta_clinico: string | null;
    triagem: string;
    patients: { full_name: string } | null;
  };

  type LinhaLink = {
    id: string;
    patient_id: string;
    gerado_em: string;
    expira_em: string;
    status: string;
    patients: { full_name: string } | null;
  };

  const checkins: CartaoCheckin[] = (
    (checkinsRes.data ?? []) as unknown as LinhaCheckin[]
  ).map((c) => ({
    id: c.id,
    patient_id: c.patient_id,
    nome: c.patients?.full_name ?? "Paciente removido",
    data: c.created_at,
    geral: c.semana_geral,
    alerta: Boolean(c.alerta_clinico),
    triagem: c.triagem,
  }));

  // Link vencido some da esteira, senão a coluna vira um cemitério de
  // cobranças que já não podem ser respondidas.
  const pendentes: CartaoPendente[] = (
    (linksRes.data ?? []) as unknown as LinhaLink[]
  )
    .filter((l) => Date.parse(l.expira_em) > momento)
    .map((l) => ({
      id: l.id,
      patient_id: l.patient_id,
      nome: l.patients?.full_name ?? "Paciente removido",
      data: l.gerado_em,
      status: l.status,
    }));

  return (
    <>
      <TituloPagina
        olho="Fluxo de trabalho"
        titulo="Esteira de check-ins"
        apoio="Arraste os cartões entre as colunas conforme você trata cada resposta. Nada de paciente esquecido."
      />

      {erro ? (
        <p
          role="alert"
          className="mt-8 rounded-xl border border-argila/35 bg-argila-suave px-4 py-3 font-sans text-sm text-argila"
        >
          Não foi possível carregar a esteira. {erro.message}
        </p>
      ) : (
        <Quadro pendentes={pendentes} checkins={checkins} />
      )}
    </>
  );
}
