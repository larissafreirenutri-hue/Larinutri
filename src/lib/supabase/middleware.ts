import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

/** Rotas que exigem sessão. Qualquer subcaminho também é protegido. */
const ROTAS_PROTEGIDAS = ["/painel"];

/**
 * Renova o token da sessão a cada requisição e barra acesso ao painel
 * quando não há usuário autenticado.
 */
export async function updateSession(request: NextRequest) {
  const { url, key } = getSupabaseEnv();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser valida o token no servidor do Supabase. Não troque por getSession,
  // que apenas lê o cookie e é falsificável.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = request.nextUrl.pathname;
  const ehProtegida = ROTAS_PROTEGIDAS.some(
    (rota) => caminho === rota || caminho.startsWith(`${rota}/`),
  );

  if (!user && ehProtegida) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/login";
    destino.searchParams.set("redirecionar", caminho);
    return NextResponse.redirect(destino);
  }

  if (user && caminho === "/login") {
    const destino = request.nextUrl.clone();
    destino.pathname = "/painel";
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  return response;
}
