import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { diaDeHoje } from "@/lib/financeiro";
import { segundaDaSemana } from "@/lib/semana";
import { abrirCheckinDaSemana } from "@/lib/abrir-checkin";

// Nunca cacheia, é uma rotina que escreve no banco a cada chamada.
export const dynamic = "force-dynamic";

/**
 * Abre o check-in da semana corrente para todos os pacientes ativos.
 * Pensada para o Vercel Cron chamar toda segunda-feira às 7h de
 * Brasília. Idempotente: rodar de novo na mesma semana não duplica nada
 * nem reabre o que já foi respondido.
 *
 * Protegida por CRON_SECRET. O Vercel Cron manda o segredo no header
 * Authorization automaticamente quando a variável existe no projeto.
 * Sem o segredo certo, a rota recusa.
 */
async function executar(request: Request) {
  const segredo = process.env.CRON_SECRET;
  const autorizacao = request.headers.get("authorization");

  if (!segredo || autorizacao !== `Bearer ${segredo}`) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const admin = createAdminClient();

  // Segunda-feira da semana corrente, no calendário de Brasília.
  const segunda = segundaDaSemana(diaDeHoje(Date.now()));

  // Só pacientes ativos. Pausados e arquivados ficam de fora. Abrimos
  // mesmo para o ativo que ainda não criou acesso ao portal, para o
  // check-in já estar lá quando ela entrar pela primeira vez.
  const { data: pacientes, error: erroPacientes } = await admin
    .from("patients")
    .select("id, owner")
    .eq("status", "ativo");

  if (erroPacientes) {
    return NextResponse.json(
      { erro: "Não foi possível carregar os pacientes." },
      { status: 500 },
    );
  }

  const ativos = pacientes ?? [];
  let abertos = 0;
  let jaExistiam = 0;
  let erros = 0;

  for (const p of ativos) {
    const r = await abrirCheckinDaSemana(admin, {
      patientId: p.id,
      owner: p.owner,
      segunda,
    });
    if (r === "aberto") abertos++;
    else if (r === "ja_existia") jaExistiam++;
    else erros++;
  }

  // Log da rodada, para a Larissa ter confiança de que funcionou. O
  // owner sai do primeiro paciente, já que o sistema é de uma só.
  const owner = ativos[0]?.owner ?? null;
  await admin.from("cron_execucoes").insert({
    owner,
    job: "abrir-checkins",
    semana_inicio: segunda,
    abertos,
    ativos: ativos.length,
    detalhe: `abertos ${abertos}, ja existiam ${jaExistiam}, erros ${erros}`,
  });

  return NextResponse.json({
    ok: true,
    semana_inicio: segunda,
    ativos: ativos.length,
    abertos,
    jaExistiam,
    erros,
  });
}

export async function GET(request: Request) {
  return executar(request);
}

export async function POST(request: Request) {
  return executar(request);
}
