import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, BUCKET_FOTOS } from "@/lib/supabase/admin";

const MAX_FOTOS = 5;
const MAX_BYTES = 10 * 1024 * 1024;

const TIPOS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Assina uma URL de upload para o paciente logado. O caminho é escopado
 * pelo id do paciente, resolvido pela sessão, então ninguém escreve na
 * pasta de outro, e um visitante sem login não sobe nada.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ erro: "Faça login para enviar fotos." }, { status: 401 });
  }

  const { data: paciente } = await supabase
    .from("patients")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!paciente) {
    return NextResponse.json({ erro: "Acompanhamento não encontrado." }, { status: 403 });
  }

  let corpo: { tipo?: string; tamanho?: number; indice?: number };
  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const extensao = TIPOS[String(corpo.tipo ?? "")];
  if (!extensao) {
    return NextResponse.json(
      { erro: "Só aceitamos imagens JPEG, PNG ou WebP." },
      { status: 400 },
    );
  }

  const tamanho = Number(corpo.tamanho ?? 0);
  if (!Number.isFinite(tamanho) || tamanho <= 0 || tamanho > MAX_BYTES) {
    return NextResponse.json(
      { erro: "Cada foto precisa ter no máximo 10 MB." },
      { status: 400 },
    );
  }

  const indice = Number(corpo.indice ?? 0);
  if (!Number.isInteger(indice) || indice < 0 || indice >= MAX_FOTOS) {
    return NextResponse.json(
      { erro: `Você pode enviar no máximo ${MAX_FOTOS} fotos.` },
      { status: 400 },
    );
  }

  const caminho = `${paciente.id}/${crypto.randomUUID()}.${extensao}`;

  try {
    const admin = createAdminClient();
    const { data: assinada, error: erroAssinatura } = await admin.storage
      .from(BUCKET_FOTOS)
      .createSignedUploadUrl(caminho);

    if (erroAssinatura || !assinada) {
      console.error(
        "[portal upload] createSignedUploadUrl falhou:",
        erroAssinatura?.message ?? "sem dados retornados",
      );
      return NextResponse.json(
        { erro: "Não foi possível preparar o envio da foto. Tente de novo." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      caminho,
      urlAssinada: assinada.signedUrl,
      tokenUpload: assinada.token,
    });
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : String(e);
    console.error("[portal upload] exceção ao preparar o envio:", mensagem);
    return NextResponse.json(
      { erro: "Não foi possível preparar o envio da foto. Tente de novo." },
      { status: 500 },
    );
  }
}
