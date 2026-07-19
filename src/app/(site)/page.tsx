import type { Metadata } from "next";
import Image from "next/image";
import { CONTEUDO, ehPendente } from "@/lib/conteudo";
import { Conteudo, Falta, Paragrafos } from "./marcador";
import { BotaoWhatsApp } from "./whatsapp";

export const metadata: Metadata = {
  title: `${CONTEUDO.marca.nome}, ${CONTEUDO.marca.profissao}`,
  description: CONTEUDO.marca.descricaoSite,
};

const { hero, sobre, servicos, contato } = CONTEUDO;

function Secao({
  id,
  children,
  className = "",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      // scroll-mt compensa o cabeçalho fixo ao pular pelas âncoras.
      className={`mx-auto w-full max-w-5xl scroll-mt-24 px-6 ${className}`}
    >
      {children}
    </section>
  );
}

function TituloSecao({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-3xl text-creme sm:text-4xl">{children}</h2>
  );
}

export default function Home() {
  return (
    <main>
      {/* Início */}
      <Secao id="inicio" className="py-20 sm:py-28">
        <p className="font-sans text-xs uppercase tracking-[0.3em] text-dourado">
          {CONTEUDO.marca.profissao}
        </p>

        <h1 className="mt-7 max-w-3xl font-display text-4xl leading-[1.15] text-creme sm:text-6xl">
          {hero.frase}
        </h1>

        <p className="mt-7 max-w-2xl font-sans text-base leading-relaxed text-creme/75 sm:text-lg">
          {hero.apoio}
        </p>

        <div className="mt-10">
          <BotaoWhatsApp />
        </div>
      </Secao>

      <div className="mx-auto h-px w-full max-w-5xl bg-dourado/15" />

      {/* Sobre */}
      <Secao id="sobre" className="py-20 sm:py-24">
        <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_320px] md:items-start">
          <div>
            <TituloSecao>{sobre.titulo}</TituloSecao>

            <div className="mt-7 space-y-5">
              <Paragrafos
                valor={sobre.texto}
                className="max-w-2xl font-sans text-base leading-relaxed text-creme/75"
              />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {ehPendente(sobre.crn) ? (
                <Falta o={sobre.crn.__pendente} />
              ) : (
                <span className="rounded-md border border-dourado/30 px-3 py-1.5 font-sans text-xs text-dourado">
                  {sobre.crn}
                </span>
              )}

              {sobre.especialidades.map((e) => (
                <span
                  key={e}
                  className="rounded-md border border-dourado/20 px-3 py-1.5 font-sans text-xs text-creme/65"
                >
                  {e}
                </span>
              ))}
            </div>
          </div>

          <div className="order-first md:order-none">
            {ehPendente(sobre.foto) ? (
              <div className="flex aspect-[4/5] w-full items-center justify-center rounded-lg border border-dashed border-dourado/40 bg-creme/5 px-6 text-center">
                <Falta o={sobre.foto.__pendente} />
              </div>
            ) : (
              <Image
                src={sobre.foto}
                alt={`Foto de ${CONTEUDO.marca.nome}`}
                width={640}
                height={800}
                className="aspect-[4/5] w-full rounded-lg object-cover"
                style={{ objectPosition: sobre.fotoPosicao }}
                priority
              />
            )}
          </div>
        </div>
      </Secao>

      <div className="mx-auto h-px w-full max-w-5xl bg-dourado/15" />

      {/* Serviços */}
      <Secao id="servicos" className="py-20 sm:py-24">
        <TituloSecao>{servicos.titulo}</TituloSecao>

        <ol className="mt-12 grid gap-6 sm:grid-cols-3">
          {servicos.itens.map((item, i) => (
            <li
              key={item.nome}
              className="rounded-lg border border-dourado/20 bg-creme/5 px-6 py-7"
            >
              <span className="font-display text-2xl text-dourado/70">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-4 font-display text-xl text-creme">
                {item.nome}
              </h3>
              <p className="mt-3 font-sans text-sm leading-relaxed text-creme/70">
                {item.texto}
              </p>
            </li>
          ))}
        </ol>
      </Secao>

      <div className="mx-auto h-px w-full max-w-5xl bg-dourado/15" />

      {/* Contato */}
      <Secao id="contato" className="py-20 sm:py-24">
        <TituloSecao>{contato.titulo}</TituloSecao>

        <p className="mt-6 max-w-xl font-sans text-base leading-relaxed text-creme/75">
          {contato.apoio}
        </p>

        <dl className="mt-10 grid max-w-2xl gap-6 sm:grid-cols-2">
          <div>
            <dt className="font-sans text-[11px] uppercase tracking-wider text-creme/40">
              Instagram
            </dt>
            <dd className="mt-1.5 font-sans text-sm text-creme/90">
              {ehPendente(contato.instagram) ? (
                <Falta o={contato.instagram.__pendente} />
              ) : (
                <a
                  href={`https://instagram.com/${contato.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-dourado transition hover:text-dourado/80"
                >
                  @{contato.instagram}
                </a>
              )}
            </dd>
          </div>

          <div>
            <dt className="font-sans text-[11px] uppercase tracking-wider text-creme/40">
              E-mail
            </dt>
            <dd className="mt-1.5 font-sans text-sm text-creme/90">
              {ehPendente(contato.email) ? (
                <Falta o={contato.email.__pendente} />
              ) : (
                <a
                  href={`mailto:${contato.email}`}
                  className="text-dourado transition hover:text-dourado/80"
                >
                  {contato.email}
                </a>
              )}
            </dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="font-sans text-[11px] uppercase tracking-wider text-creme/40">
              Atendimento
            </dt>
            <dd className="mt-1.5 font-sans text-sm text-creme/90">
              <Conteudo valor={contato.atendimento} />
            </dd>
          </div>
        </dl>

        <div className="mt-10">
          <BotaoWhatsApp rotulo="Chamar no WhatsApp" />
        </div>
      </Secao>
    </main>
  );
}
