import type { MetadataRoute } from "next";

/**
 * Manifesto do portal do paciente, para o site poder ser adicionado à
 * tela inicial do celular e abrir como um aplicativo. Começa já na área
 * logada, e se a sessão tiver caído o proxy leva ao login.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Acompanhamento, Larissa Freire",
    short_name: "Acompanhamento",
    description:
      "Acompanhe a sua evolução nutricional com a Larissa Freire.",
    start_url: "/meu-acompanhamento",
    display: "standalone",
    background_color: "#4A3220",
    theme_color: "#4A3220",
    lang: "pt-BR",
    icons: [
      {
        src: "/icone-portal.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icone-portal.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
