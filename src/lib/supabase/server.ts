import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

/**
 * Cliente Supabase para Server Components, Route Handlers e Server Actions.
 * A sessão vive nos cookies, então cada requisição monta o seu próprio cliente.
 */
export async function createClient() {
  const { url, key } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Chamado a partir de um Server Component. O middleware renova a
          // sessão, então pode ser ignorado com segurança.
        }
      },
    },
  });
}
