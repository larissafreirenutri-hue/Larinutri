import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatarData } from "@/lib/formato";
import { agora } from "@/lib/visao-geral";
import { statusEfetivo, proximaSemana, type CheckinLink } from "@/lib/links";
import type { Checkin, Paciente } from "@/lib/tipos";
import type { Anamnese, AnamneseLink } from "@/lib/anamnese";
import { gerarLinkDoPaciente } from "../../links/actions";
import { Avatar } from "../../marca";
import {
  Cartao,
  SeloLink,
  SeloStatusPaciente,
  CLASSE_BOTAO_SECUNDARIO,
} from "../../ui";
import { Ficha } from "./ficha";
import { createAdminClient, BUCKET_FOTOS } from "@/lib/supabase/admin";
import { arquivarPaciente } from "../actions";

export const metadata: Metadata = {
  title: "Ficha do paciente, Larissa Freire Nutricionista",
};

export default async function PacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const momento = agora();

  const { data: dadosPaciente } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  // RLS devolve zero linhas para paciente de outra nutricionista,
  // então vira 404 sem revelar que o registro existe.
  if (!dadosPaciente) {
    notFound();
  }

  const paciente = dadosPaciente as Paciente;

  const [checkinsRes, linksRes, anamneseRes, anamneseLinkRes] =
    await Promise.all([
      supabase
        .from("checkins")
        .select("*")
        .eq("patient_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("checkin_links")
        .select("*")
        .eq("patient_id", id)
        .order("gerado_em", { ascending: false }),
      // A anamnese ativa é a que não foi substituída.
      supabase
        .from("anamneses")
        .select("*")
        .eq("patient_id", id)
        .is("substituida_em", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("anamnese_links")
        .select("*")
        .eq("patient_id", id)
        .order("gerado_em", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const anamnese = (anamneseRes.data ?? null) as Anamnese | null;
  const anamneseLink = (anamneseLinkRes.data ?? null) as AnamneseLink | null;

  const checkins = (checkinsRes.data ?? []) as Checkin[];

  // As fotos vivem em bucket privado. Aqui elas ganham URL assinada de
  // leitura, válida por uma hora, gerada no servidor. O caminho bruto
  // nunca chega ao navegador.
  const urlsPorCheckin: Record<string, string[]> = {};
  const comFotos = checkins.filter((c) => (c.fotos ?? []).length > 0);

  if (comFotos.length > 0) {
    const admin = createAdminClient();
    await Promise.all(
      comFotos.map(async (c) => {
        const { data } = await admin.storage
          .from(BUCKET_FOTOS)
          .createSignedUrls(c.fotos as string[], 60 * 60);
        urlsPorCheckin[c.id] = (data ?? [])
          .map((d) => d.signedUrl)
          .filter((u): u is string => Boolean(u));
      }),
    );
  }
  const links = (linksRes.data ?? []) as CheckinLink[];
  const linkAtual = links[0] ?? null;

  const subtitulo = [
    paciente.objetivo,
    paciente.plano_nome
      ? [paciente.plano_nome, paciente.plano_duracao].filter(Boolean).join(" ")
      : null,
    paciente.plano_vence ? `vence ${formatarData(paciente.plano_vence)}` : null,
  ]
    .filter(Boolean)
    .join("  ·  ");

  const arquivado = paciente.status === "arquivado";

  return (
    <>
      <Link
        href="/painel/pacientes"
        className="font-sans text-[14px] text-vital-fundo transition hover:text-vital"
      >
        ← voltar para pacientes
      </Link>

      <Cartao className="mt-4 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar nome={paciente.full_name} tamanho="lg" />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-[28px] leading-tight text-barra">
                  {paciente.full_name}
                </h1>
                <SeloStatusPaciente status={paciente.status ?? "ativo"} />
              </div>

              <p className="mt-1 font-sans text-[15px] text-neutro">
                {subtitulo || "Sem plano cadastrado"}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/painel/pacientes/${paciente.id}/editar`}
                className={CLASSE_BOTAO_SECUNDARIO}
              >
                Editar
              </Link>

              <form action={arquivarPaciente}>
                <input type="hidden" name="id" value={paciente.id} />
                <input
                  type="hidden"
                  name="status"
                  value={arquivado ? "ativo" : "arquivado"}
                />
                <button type="submit" className={CLASSE_BOTAO_SECUNDARIO}>
                  {arquivado ? "Reativar" : "Arquivar"}
                </button>
              </form>

              <form action={gerarLinkDoPaciente}>
                <input type="hidden" name="patient_id" value={paciente.id} />
                <input
                  type="hidden"
                  name="semana"
                  value={proximaSemana(links.map((l) => l.semana))}
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-vital px-5 py-2.5 font-sans text-[15px] font-semibold text-white shadow-acao transition hover:brightness-105"
                >
                  Gerar check-in
                </button>
              </form>
            </div>

            {linkAtual ? (
              <p className="flex items-center gap-2 font-sans text-[13px] text-neutro">
                link atual:{" "}
                <SeloLink status={statusEfetivo(linkAtual, momento)} />
              </p>
            ) : (
              <p className="font-sans text-[13px] text-tenue">
                nenhum link gerado ainda
              </p>
            )}
          </div>
        </div>
      </Cartao>

      <Ficha
        paciente={paciente}
        checkins={checkins}
        urlsPorCheckin={urlsPorCheckin}
        anamnese={anamnese}
        anamneseLink={anamneseLink}
        agora={momento}
        botaoEditarDados={
          <Link
            href={`/painel/pacientes/${paciente.id}/editar`}
            className={CLASSE_BOTAO_SECUNDARIO}
          >
            Editar
          </Link>
        }
      />
    </>
  );
}
