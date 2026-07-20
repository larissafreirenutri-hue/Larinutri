import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CONTEUDO, ehPendente } from "@/lib/conteudo";
import { sair } from "@/app/login/actions";
import { Cartao, Olho, Selo, TituloPagina, CLASSE_BOTAO_SECUNDARIO } from "../ui";

export const metadata: Metadata = {
  title: "Ajustes, Larissa Freire Nutricionista",
};

function Linha({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-linha py-4 last:border-0">
      <Olho>{rotulo}</Olho>
      <div className="text-right font-sans text-[15px] text-tinta">
        {children}
      </div>
    </div>
  );
}

export default async function AjustesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Contagens exatas, sem trazer as linhas.
  const [pacientes, checkins, links, leads, lancamentos, tarefas] =
    await Promise.all([
      supabase.from("patients").select("id", { count: "exact", head: true }),
      supabase.from("checkins").select("id", { count: "exact", head: true }),
      supabase.from("checkin_links").select("id", { count: "exact", head: true }),
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase.from("transactions").select("id", { count: "exact", head: true }),
      supabase.from("tasks").select("id", { count: "exact", head: true }),
    ]);

  const crn = CONTEUDO.sobre.crn;
  const faltaCrn = ehPendente(crn);
  const faltaSobre = ehPendente(CONTEUDO.sobre.texto);

  const dados = [
    { rotulo: "Pacientes", valor: pacientes.count ?? 0 },
    { rotulo: "Check-ins", valor: checkins.count ?? 0 },
    { rotulo: "Links gerados", valor: links.count ?? 0 },
    { rotulo: "Leads", valor: leads.count ?? 0 },
    { rotulo: "Lançamentos", valor: lancamentos.count ?? 0 },
    { rotulo: "Tarefas", valor: tarefas.count ?? 0 },
  ];

  return (
    <>
      <TituloPagina
        olho="Configuração"
        titulo="Ajustes"
        apoio="Sua conta, o que está publicado no site e o resumo do que existe no sistema."
      />

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <div className="grid content-start gap-5">
          <Cartao>
            <header className="border-b border-linha px-6 py-5">
              <h2 className="font-display text-[21px] text-barra">Conta</h2>
            </header>
            <div className="px-6 py-2">
              <Linha rotulo="E-mail de acesso">{user?.email}</Linha>
              <Linha rotulo="Perfil">Nutricionista</Linha>
              <Linha rotulo="Sessão">
                <form action={sair}>
                  <button type="submit" className={CLASSE_BOTAO_SECUNDARIO}>
                    Encerrar sessão
                  </button>
                </form>
              </Linha>
            </div>
          </Cartao>

          <Cartao>
            <header className="border-b border-linha px-6 py-5">
              <h2 className="font-display text-[21px] text-barra">
                Site público
              </h2>
            </header>
            <div className="px-6 py-2">
              <Linha rotulo="Endereço">
                <a
                  href="https://www.larissafreirenutri.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-vital-fundo underline underline-offset-2"
                >
                  larissafreirenutri.com
                </a>
              </Linha>
              <Linha rotulo="Privacidade">
                <Link
                  href="/privacidade"
                  className="text-vital-fundo underline underline-offset-2"
                >
                  Ver a política
                </Link>
              </Linha>
              <Linha rotulo="CRN">
                {faltaCrn ? (
                  <Selo tom="mel">a preencher</Selo>
                ) : (
                  (crn as string)
                )}
              </Linha>
              <Linha rotulo="Texto do sobre">
                {faltaSobre ? (
                  <Selo tom="mel">a preencher</Selo>
                ) : (
                  <Selo tom="vital">publicado</Selo>
                )}
              </Linha>
            </div>

            {faltaCrn || faltaSobre ? (
              <div className="mx-6 mb-6 rounded-r-xl border-l-4 border-mel bg-mel-suave px-4 py-3.5">
                <p className="font-sans text-[13.5px] leading-relaxed text-mel-tinta">
                  Esses campos aparecem como aviso dourado para quem visita o
                  site. Eles ficam no arquivo{" "}
                  <span className="font-mono text-[12.5px]">
                    src/lib/conteudo.ts
                  </span>
                  , e ainda não são editáveis por aqui.
                </p>
              </div>
            ) : null}
          </Cartao>
        </div>

        <div className="grid content-start gap-5">
          <Cartao>
            <header className="border-b border-linha px-6 py-5">
              <h2 className="font-display text-[21px] text-barra">
                Como funciona o check-in
              </h2>
            </header>
            <div className="px-6 py-5">
              <ul className="space-y-3 font-sans text-[14.5px] leading-relaxed text-neutro">
                <li>
                  Cada link é individual, expira em <strong className="text-tinta">7 dias</strong>{" "}
                  e só pode ser respondido uma vez.
                </li>
                <li>
                  A resposta entra na esteira como{" "}
                  <strong className="text-tinta">Respondido</strong>, e sai de
                  lá quando você marca como Analisado.
                </li>
                <li>
                  Quem sinaliza dor ou mal-estar vai direto para o topo da
                  Triagem, com alerta clínico.
                </li>
              </ul>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/painel/links" className={CLASSE_BOTAO_SECUNDARIO}>
                  Gerar links
                </Link>
                <Link href="/painel/esteira" className={CLASSE_BOTAO_SECUNDARIO}>
                  Abrir a esteira
                </Link>
              </div>
            </div>
          </Cartao>

          <Cartao>
            <header className="border-b border-linha px-6 py-5">
              <h2 className="font-display text-[21px] text-barra">
                O que existe no sistema
              </h2>
            </header>
            <div className="grid grid-cols-2 gap-x-6 px-6 py-2 sm:grid-cols-3">
              {dados.map((d) => (
                <div key={d.rotulo} className="border-b border-linha py-4">
                  <Olho>{d.rotulo}</Olho>
                  <p className="mt-1.5 font-mono text-[20px] font-bold text-tinta">
                    {d.valor}
                  </p>
                </div>
              ))}
            </div>
          </Cartao>

          <Cartao>
            <header className="border-b border-linha px-6 py-5">
              <h2 className="font-display text-[21px] text-barra">
                Dados e privacidade
              </h2>
            </header>
            <div className="px-6 py-5">
              <p className="font-sans text-[14.5px] leading-relaxed text-neutro">
                Os dados de saúde ficam isolados por nutricionista no banco, e
                nenhuma outra conta consegue lê-los. Se um paciente pedir a
                exclusão, apagar a ficha dele remove junto todos os check-ins e
                links, sem deixar rastro.
              </p>
              <p className="mt-3 font-sans text-[14.5px] leading-relaxed text-neutro">
                Para apenas tirar alguém da lista sem perder o histórico, use{" "}
                <strong className="text-tinta">Arquivar</strong> em vez de
                Excluir.
              </p>
            </div>
          </Cartao>
        </div>
      </div>
    </>
  );
}
