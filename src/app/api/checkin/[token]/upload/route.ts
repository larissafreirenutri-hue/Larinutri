import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, BUCKET_FOTOS } from "@/lib/supabase/admin";

export const MAX_FOTOS = 5;
export const MAX_BYTES = 10 * 1024 * 1024;

const TIPOS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * Assina uma URL de upload para o paciente, que é anônimo e só tem o
 * token. Nada é assinado antes do token ser validado, então um token
 * inválido, vencido ou já respondido não consegue subir arquivo algum.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

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

  // A validação do token usa a mesma função pública do formulário, com
  // a chave publishable. Ela recusa link vencido ou já respondido.
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_checkin_link", {
    p_token: token,
  });

  const linha = Array.isArray(data) ? data[0] : null;
  if (error || !linha?.primeiro_nome) {
    return NextResponse.json(
      { erro: "Este link não é mais válido. Peça um novo para a sua nutricionista." },
      { status: 403 },
    );
  }

  // O caminho é escopado pelo token, então um paciente nunca escreve
  // na pasta de outro. O nome é aleatório para não vazar ordem nem
  // nome de arquivo original.
  const caminho = `${token}/${crypto.randomUUID()}.${extensao}`;

  try {
    // createAdminClient lança se a SUPABASE_SECRET_KEY faltar. Sem o
    // try, isso viraria um 500 genérico, sem pista no formulário nem
    // no log. O erro real vai para o terminal do servidor, e o
    // paciente recebe só uma mensagem limpa, sem vazar segredo.
    const admin = createAdminClient();
    const { data: assinada, error: erroAssinatura } = await admin.storage
      .from(BUCKET_FOTOS)
      .createSignedUploadUrl(caminho);

    if (erroAssinatura || !assinada) {
      console.error(
        "[upload] createSignedUploadUrl falhou:",
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
    console.error("[upload] exceção ao preparar o envio:", mensagem);
    return NextResponse.json(
      { erro: "Não foi possível preparar o envio da foto. Tente de novo." },
      { status: 500 },
    );
  }
}
