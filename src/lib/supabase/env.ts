export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Variáveis do Supabase ausentes. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY em .env.local.",
    );
  }

  return { url, key };
}

/** Checagem leve, sem lançar erro, para a home mostrar o status da configuração. */
export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
  return (
    url.startsWith("https://") &&
    !url.includes("SEU-PROJETO") &&
    key.startsWith("sb_publishable_") &&
    !key.includes("COLE_AQUI")
  );
}
