"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Revela o conteúdo com um leve fade e subida quando ele entra na
 * tela. Discreto de propósito.
 *
 * O respeito a prefers-reduced-motion mora no CSS, nas variantes
 * motion-reduce abaixo: quem pede menos movimento vê tudo já visível e
 * sem transição, independente do observer. Assim o JS não precisa de
 * um ramo que altera estado no corpo do efeito.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisivel(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out motion-reduce:!translate-y-0 motion-reduce:!opacity-100 motion-reduce:!transition-none ${
        visivel ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      } ${className}`}
      style={{ transitionDelay: visivel ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
