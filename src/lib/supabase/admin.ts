// Esta linha é a trava principal. Se este arquivo for importado, mesmo
// que indiretamente, por um componente de cliente, o build falha em
// vez de mandar a Secret key para o navegador.
import "server-only";

import { createClient } from "@supabase/supabase-js";

export const BUCKET_FOTOS = "checkin-fotos";

/**
 * Cliente com a Secret key. Ele ignora o RLS por completo, então só
 * pode ser usado em código de servidor, e apenas para o que exige
 * privilégio: assinar URLs de upload e de leitura das fotos.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    throw new Error(
      "Variáveis ausentes. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY no ambiente do servidor.",
    );
  }

  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
