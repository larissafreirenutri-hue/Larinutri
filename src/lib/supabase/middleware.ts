import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";
import { papelDoUsuario } from "@/lib/portal";

/**
 * Renova o token da sessão a cada requisição e roteia por papel. A
 * nutricionista fica restrita ao painel, o paciente ao portal, e uma
 * tentativa cruzada é redirecionada. Isto é a camada de roteamento, a
 * proteção de dados mora no RLS do banco.
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
  const pedePainel = caminho === "/painel" || caminho.startsWith("/painel/");
  const pedePortal =
    caminho === "/meu-acompanhamento" ||
    caminho.startsWith("/meu-acompanhamento/");

  const redirecionarPara = (pathname: string, manterRedirect = false) => {
    const destino = request.nextUrl.clone();
    destino.pathname = pathname;
    destino.search = "";
    if (manterRedirect) destino.searchParams.set("redirecionar", caminho);
    return NextResponse.redirect(destino);
  };

  // Sem sessão: cada área manda para o seu próprio login.
  if (!user) {
    if (pedePainel) return redirecionarPara("/login", true);
    if (pedePortal) return redirecionarPara("/entrar", true);
    return response;
  }

  const papel = papelDoUsuario(user.app_metadata);

  if (papel === "paciente") {
    // Paciente nunca entra no painel da nutricionista.
    if (pedePainel) return redirecionarPara("/meu-acompanhamento");
    if (caminho === "/entrar" || caminho === "/login") {
      return redirecionarPara("/meu-acompanhamento");
    }
    return response;
  }

  // Nutricionista: fica no painel, não usa a área do paciente.
  if (pedePortal) return redirecionarPara("/painel");
  if (caminho === "/login" || caminho === "/entrar") {
    return redirecionarPara("/painel");
  }

  return response;
}
