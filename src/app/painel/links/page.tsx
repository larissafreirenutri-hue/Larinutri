import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { agora } from "@/lib/visao-geral";
import { proximaSemana, type CheckinLink } from "@/lib/links";
import { TituloPagina } from "../ui";
import { Links } from "./tabela";

export const metadata: Metadata = {
  title: "Links, Larissa Freire Nutricionista",
};

export default async function LinksPage() {
  const supabase = await createClient();
  const momento = agora();

  // O RLS limita as duas consultas às linhas desta nutricionista.
  const [pacientesRes, linksRes] = await Promise.all([
    supabase
      .from("patients")
      .select("id, full_name, status")
      .order("full_name"),
    supabase
      .from("checkin_links")
      .select("*, patients(id, full_name)")
      .order("gerado_em", { ascending: false }),
  ]);

  const erro = pacientesRes.error ?? linksRes.error;
  const links = (linksRes.data ?? []) as unknown as CheckinLink[];

  // A semana sugerida sai do maior número já gerado para o paciente.
  const pacientes = (pacientesRes.data ?? [])
    .filter((p) => p.status !== "arquivado")
    .map((p) => ({
      id: p.id as string,
      full_name: p.full_name as string,
      proxima: proximaSemana(
        links.filter((l) => l.patient_id === p.id).map((l) => l.semana),
      ),
    }));

  return (
    <>
      <TituloPagina
        olho="Geração de check-in"
        titulo="Links de check-in"
        apoio="Gere, acompanhe e distribua os links individuais de cada paciente. Do envio à resposta, tudo em um só lugar."
      />

      {erro ? (
        <p
          role="alert"
          className="mt-8 rounded-xl border border-argila/35 bg-argila-suave px-4 py-3 font-sans text-sm text-argila"
        >
          Não foi possível carregar os links. {erro.message}
        </p>
      ) : (
        <Links pacientes={pacientes} links={links} agora={momento} />
      )}
    </>
  );
}
