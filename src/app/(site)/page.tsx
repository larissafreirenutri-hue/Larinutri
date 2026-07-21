import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CONTEUDO, ehPendente } from "@/lib/conteudo";
import { Paragrafos } from "./marcador";
import { BotaoWhatsApp } from "./whatsapp";
import { Reveal } from "./reveal";

export const metadata: Metadata = {
  title: `${CONTEUDO.marca.nome}, ${CONTEUDO.marca.profissao}`,
  description: CONTEUDO.marca.descricaoSite,
};

const { hero, sobre, passos, especialidadesCards, depoimento, praticas, chamadaFinal, contato } =
  CONTEUDO;

function Olho({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-dourado">
      {children}
    </p>
  );
}

/** Foto em moldura de arco, com selinho flutuante opcional. */
function FotoArco({
  src,
  selo,
  priority = false,
}: {
  src: string;
  selo?: React.ReactNode;
  priority?: boolean;
}) {
  return (
    <div className="relative">
      <div className="overflow-hidden rounded-[200px_200px_28px_28px] border border-dourado/20 shadow-2xl">
        <Image
          src={src}
          alt={`Foto de ${CONTEUDO.marca.nome}`}
          width={733}
          height={1100}
          className="aspect-[4/5] w-full object-cover"
          style={{ objectPosition: sobre.fotoPosicao }}
          priority={priority}
        />
      </div>
      {selo}
    </div>
  );
}

export default function Home() {
  return (
    <main className="overflow-hidden">
      {/* 2. Hero */}
      <section id="inicio" className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
        <div className="grid items-center gap-12 md:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <Reveal>
            <Olho>{CONTEUDO.marca.profissao}</Olho>

            <h1 className="mt-6 font-display text-4xl leading-[1.08] text-creme sm:text-5xl lg:text-6xl">
              {hero.tituloAntes}{" "}
              <em className="italic text-dourado">{hero.tituloDestaque}</em>{" "}
              {hero.tituloDepois}
            </h1>

            <p className="mt-6 max-w-xl font-sans text-base leading-relaxed text-creme/75 sm:text-lg">
              {hero.apoio}
            </p>

            <p className="mt-7 inline-flex items-center gap-2 rounded-full border border-dourado/25 px-4 py-1.5 font-sans text-xs text-creme/70">
              <span className="h-1.5 w-1.5 rounded-full bg-dourado" />
              {hero.selo}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <BotaoWhatsApp rotulo="Agendar avaliação" />
              <Link
                href="/#sobre"
                className="inline-block rounded-md border border-dourado/40 px-7 py-3.5 font-sans text-sm text-dourado transition hover:bg-dourado/10"
              >
                Conheça a Larissa
              </Link>
            </div>

            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-dourado/15 pt-6 font-sans text-sm text-creme/60">
              <li className="flex items-center gap-2">
                <span className="text-dourado">◈</span> Formada pela UFRN
              </li>
              {sobre.especialidades.map((e) => (
                <li key={e} className="flex items-center gap-2">
                  <span className="text-dourado">◈</span> {e}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120}>
            <FotoArco
              src={sobre.foto}
              priority
              selo={
                <div className="absolute -bottom-4 -left-4 rounded-2xl border border-dourado/20 bg-marrom/95 px-5 py-3 shadow-xl backdrop-blur sm:-left-6">
                  <p className="font-display text-lg text-dourado">
                    {sobre.especialidades[0] ?? "Nutrição"}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-creme/55">
                    e {sobre.especialidades[1] ?? "acompanhamento"}
                  </p>
                </div>
              }
            />
          </Reveal>
        </div>
      </section>

      {/* 3. Sobre */}
      <section id="sobre" className="border-t border-dourado/10 bg-marrom">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 sm:py-28 md:grid-cols-[0.85fr_1.15fr] md:items-start lg:gap-16">
          <Reveal className="relative">
            <FotoArco
              src={sobre.fotoSobre}
              selo={
                <div className="absolute -bottom-4 left-1/2 w-[85%] -translate-x-1/2 rounded-2xl border border-dourado/20 bg-marrom-alta/95 px-5 py-3 text-center shadow-xl">
                  <p className="font-display text-lg text-creme">
                    {CONTEUDO.marca.nome}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-dourado">
                    Formada pela UFRN
                  </p>
                </div>
              }
            />
          </Reveal>

          <Reveal delay={100}>
            <Olho>Sobre mim</Olho>
            <h2 className="mt-5 font-display text-3xl text-creme sm:text-4xl">
              Prazer, sou a Larissa.
            </h2>
            <div className="mt-6 space-y-4">
              <Paragrafos
                valor={sobre.texto}
                className="font-sans text-base leading-relaxed text-creme/75"
              />
            </div>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                "Nutrição pela UFRN, 2026",
                ...sobre.especialidades,
                "Atendimento on-line e domiciliar",
              ].map((c) => (
                <li
                  key={c}
                  className="flex items-center gap-3 rounded-lg border border-dourado/15 bg-creme/[0.03] px-4 py-3 font-sans text-sm text-creme/80"
                >
                  <span className="text-dourado">✓</span> {c}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* 4. Como funciona */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
        <Reveal className="text-center">
          <Olho>Como funciona</Olho>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl text-creme sm:text-4xl">
            Simples desde o primeiro contato.
          </h2>
        </Reveal>

        <div className="relative mt-16 grid gap-12 sm:grid-cols-3 sm:gap-8">
          {/* Linha que liga os três passos, só no desktop. */}
          <div className="absolute left-[16%] right-[16%] top-7 hidden h-px bg-dourado/20 sm:block" />

          {passos.map((passo, i) => (
            <Reveal key={passo.titulo} delay={i * 120} className="relative text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-dourado/30 bg-marrom font-display text-xl text-dourado">
                {i + 1}
              </div>
              <h3 className="mt-5 font-display text-xl text-creme">
                {passo.titulo}
              </h3>
              <p className="mx-auto mt-2 max-w-xs font-sans text-sm leading-relaxed text-creme/65">
                {passo.texto}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 5. Especialidades */}
      <section id="servicos" className="border-t border-dourado/10 bg-marrom">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 sm:py-28 md:grid-cols-[0.8fr_1.2fr] md:items-start lg:gap-16">
          <Reveal>
            <Olho>Especialidades</Olho>
            <h2 className="mt-5 font-display text-3xl text-creme sm:text-4xl">
              Um plano para o seu objetivo.
            </h2>
            <p className="mt-5 max-w-sm font-sans text-base leading-relaxed text-creme/70">
              Seja qual for o seu ponto de partida, o acompanhamento se molda a
              ele, não o contrário.
            </p>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {especialidadesCards.map((card, i) => (
              <Reveal key={card.nome} delay={i * 80}>
                <div className="h-full rounded-2xl border border-dourado/15 bg-creme/[0.03] px-6 py-6 transition hover:border-dourado/40">
                  <h3 className="font-display text-xl text-dourado">
                    {card.nome}
                  </h3>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-creme/70">
                    {card.texto}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Depoimento */}
      <section className="bg-marrom-alta">
        <div className="mx-auto w-full max-w-4xl px-6 py-20 text-center sm:py-28">
          <Reveal>
            <span className="font-display text-6xl leading-none text-dourado/40">
              “
            </span>
            <blockquote className="mt-2 font-display text-2xl italic leading-relaxed text-creme sm:text-3xl">
              {depoimento.texto}
            </blockquote>
            <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.2em] text-dourado">
              {depoimento.atribuicao}
            </p>
          </Reveal>
        </div>
      </section>

      {/* 7. Informações práticas */}
      <section id="contato" className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28">
        <Reveal className="text-center">
          <Olho>Informações práticas</Olho>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl text-creme sm:text-4xl">
            Tudo que você precisa saber para começar.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {praticas.map((item, i) => (
            <Reveal key={item.titulo} delay={i * 100}>
              <div className="h-full rounded-2xl border border-dourado/15 bg-creme/[0.03] px-6 py-7">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-dourado/15 font-display text-lg text-dourado">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-display text-lg text-creme">
                  {item.titulo}
                </h3>
                <p className="mt-2 font-sans text-sm leading-relaxed text-creme/70">
                  {item.texto}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-16 rounded-3xl border border-dourado/20 bg-marrom-alta px-6 py-14 text-center sm:px-12">
          <h2 className="mx-auto max-w-2xl font-display text-3xl leading-tight text-creme sm:text-4xl">
            {chamadaFinal.antes}{" "}
            <em className="italic text-dourado">{chamadaFinal.destaque}</em>
            {chamadaFinal.depois}
          </h2>
          <p className="mx-auto mt-4 max-w-md font-sans text-base text-creme/70">
            {chamadaFinal.apoio}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <BotaoWhatsApp rotulo="Agendar avaliação" />
            {!ehPendente(contato.email) ? (
              <a
                href={`mailto:${contato.email}`}
                className="inline-block rounded-md border border-dourado/40 px-7 py-3.5 font-sans text-sm text-dourado transition hover:bg-dourado/10"
              >
                Enviar um e-mail
              </a>
            ) : null}
          </div>
        </Reveal>
      </section>
    </main>
  );
}
