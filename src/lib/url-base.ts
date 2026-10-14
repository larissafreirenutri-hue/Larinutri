import { headers } from "next/headers";

/**
 * URL absoluta do site, montada a partir dos cabeçalhos da requisição.
 * Funciona em localhost e no domínio real, sem variável de ambiente,
 * no mesmo espírito do window.location.origin usado no cliente.
 */
export async function urlBase(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
