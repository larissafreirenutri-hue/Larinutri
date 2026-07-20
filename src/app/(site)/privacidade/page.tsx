import type { Metadata } from "next";
import { CONTEUDO, ehPendente } from "@/lib/conteudo";
import { Falta } from "../marcador";

export const metadata: Metadata = {
  title: `Política de privacidade, ${CONTEUDO.marca.nome}`,
  description:
    "Como os seus dados de contato e de acompanhamento nutricional são coletados, usados e protegidos.",
};

const { privacidade, contato } = CONTEUDO;

// O e-mail do encarregado cai no e-mail de contato quando não for
// preenchido, para a página nunca ficar sem canal de solicitação.
const emailLGPD = ehPendente(privacidade.emailEncarregado)
  ? contato.email
  : privacidade.emailEncarregado;

function Bloco({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl text-dourado">{titulo}</h2>
      <div className="mt-4 space-y-4 font-sans text-sm leading-relaxed text-creme/75">
        {children}
      </div>
    </section>
  );
}

export default function PrivacidadePage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 sm:py-20">
      <h1 className="font-display text-3xl text-creme sm:text-4xl">
        Política de privacidade
      </h1>
      <p className="mt-3 font-sans text-xs text-creme/45">
        Atualizada em {privacidade.atualizadoEm}
      </p>

      <p className="mt-8 font-sans text-base leading-relaxed text-creme/80">
        Esta página explica, em linguagem direta, quais informações são
        coletadas neste site, para que servem e como você pode pedir acesso ou
        remoção delas a qualquer momento.
      </p>

      <Bloco titulo="Quem é responsável pelos seus dados">
        <p>
          {privacidade.responsavel} é a responsável pelo tratamento das
          informações descritas aqui, nos termos da Lei Geral de Proteção de
          Dados, a Lei 13.709 de 2018.
        </p>
      </Bloco>

      <Bloco titulo="Quais dados são coletados">
        <p>
          <strong className="text-creme">Dados de cadastro.</strong> Quando você
          inicia um acompanhamento, a nutricionista registra o seu nome e, se
          você fornecer, o seu e-mail e telefone. Esses dados servem para
          identificar você e manter o contato.
        </p>
        <p>
          <strong className="text-creme">
            Dados de acompanhamento nutricional.
          </strong>{" "}
          Pelo formulário de check-in, você pode informar peso, adesão ao plano
          alimentar, qualidade do sono, nível de fome, dias de atividade física e
          observações livres sobre a sua semana. Todos os campos são opcionais,
          você responde apenas o que quiser.
        </p>
        <p>
          <strong className="text-creme">Anamnese inicial.</strong> No começo do
          acompanhamento, você responde um formulário mais completo sobre a sua
          rotina, o seu histórico de saúde, o seu sono e as suas preferências
          alimentares. Essas respostas dão a base do seu plano e são tratadas com
          o mesmo cuidado dos demais dados de saúde.
        </p>
        <p>
          <strong className="text-creme">Fotos de acompanhamento.</strong> Você
          pode, se quiser, enviar até cinco fotos por check-in. Elas são
          opcionais, ficam guardadas em área privada com acesso restrito, e só a
          nutricionista consegue visualizá-las, por meio de um endereço
          temporário que expira. Elas nunca ficam disponíveis por link público.
        </p>
        <p>
          Essas informações são dados pessoais sensíveis, porque dizem respeito à
          sua saúde. Por isso elas só são tratadas com o seu consentimento
          expresso, que você dá ao marcar a caixa antes de enviar cada check-in.
        </p>
        <p>
          Este site não usa cookies de publicidade, não faz rastreamento de
          navegação e não compartilha dados com redes sociais ou ferramentas de
          análise de terceiros.
        </p>
      </Bloco>

      <Bloco titulo="Para que os dados são usados">
        <p>
          Exclusivamente para o seu acompanhamento nutricional. A nutricionista
          usa as respostas dos check-ins, e as fotos que você enviar, para
          entender a sua evolução, ajustar o seu plano alimentar e preparar as
          consultas.
        </p>
        <p>
          Os seus dados não são vendidos, alugados nem usados para publicidade,
          e não são compartilhados com outras pessoas ou empresas, salvo
          obrigação legal ou determinação judicial.
        </p>
      </Bloco>

      <Bloco titulo="Como os dados são protegidos">
        <p>
          As informações ficam armazenadas em servidor seguro, com criptografia
          em trânsito e controle de acesso por autenticação. Apenas a
          nutricionista responsável pelo seu atendimento consegue visualizar os
          seus dados.
        </p>
        <p>
          O seu link pessoal de check-in é individual e não deve ser
          compartilhado com outras pessoas.
        </p>
      </Bloco>

      <Bloco titulo="Por quanto tempo ficam guardados">
        <p>
          Os dados são mantidos enquanto durar o seu acompanhamento e pelo prazo
          exigido pela legislação profissional aplicável aos registros de
          atendimento em saúde. Depois disso, ou a pedido seu, eles são
          excluídos.
        </p>
      </Bloco>

      <Bloco titulo="Os seus direitos">
        <p>A qualquer momento, sem custo, você pode solicitar:</p>
        <ul className="ml-5 list-disc space-y-2">
          <li>confirmação de que existem dados seus e acesso a eles;</li>
          <li>correção de informações incompletas ou desatualizadas;</li>
          <li>exclusão dos seus dados;</li>
          <li>
            informação sobre com quem os seus dados foram compartilhados, se for
            o caso;
          </li>
          <li>
            revogação do consentimento, o que interrompe novos tratamentos.
          </li>
        </ul>
      </Bloco>

      <Bloco titulo="Como fazer uma solicitação">
        <p>
          Escreva para{" "}
          {ehPendente(emailLGPD) ? (
            <Falta o={emailLGPD.__pendente} />
          ) : (
            <a
              href={`mailto:${emailLGPD}`}
              className="text-dourado transition hover:text-dourado/80"
            >
              {emailLGPD}
            </a>
          )}{" "}
          com o assunto Proteção de dados. O pedido é respondido no menor prazo
          possível.
        </p>
      </Bloco>
    </main>
  );
}
