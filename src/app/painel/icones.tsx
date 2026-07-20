/**
 * Ícones de traço fino da barra superior, no estilo das referências.
 * Inline em vez de biblioteca: são nove, e um pacote de ícones custaria
 * mais que o arquivo inteiro.
 */
const base = {
  width: 17,
  height: 17,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function IconeTriagem() {
  return (
    <svg {...base}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
    </svg>
  );
}

export function IconeEsteira() {
  return (
    <svg {...base}>
      <rect x="3" y="4" width="5" height="16" rx="1.2" />
      <rect x="9.5" y="4" width="5" height="11" rx="1.2" />
      <rect x="16" y="4" width="5" height="14" rx="1.2" />
    </svg>
  );
}

export function IconeLinks() {
  return (
    <svg {...base}>
      <path d="M10 13.5a4 4 0 0 0 5.7.3l2.6-2.6a4 4 0 0 0-5.7-5.7l-1.3 1.3" />
      <path d="M14 10.5a4 4 0 0 0-5.7-.3l-2.6 2.6a4 4 0 0 0 5.7 5.7l1.3-1.3" />
    </svg>
  );
}

export function IconePacientes() {
  return (
    <svg {...base}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.2 2.5-5.2 5.5-5.2s5.5 2 5.5 5.2" />
      <path d="M16.5 5.2a3.2 3.2 0 0 1 0 6" />
      <path d="M17.5 14.9c2.1.5 3.5 2.2 3.5 5.1" />
    </svg>
  );
}

export function IconeVisao() {
  return (
    <svg {...base}>
      <path d="M4 19V11" />
      <path d="M9.3 19V5" />
      <path d="M14.7 19v-6" />
      <path d="M20 19V8" />
    </svg>
  );
}

export function IconeVendas() {
  return (
    <svg {...base}>
      <path d="M3 5h18l-6.8 8v6l-4.4 2v-8L3 5z" />
    </svg>
  );
}

export function IconeFinanceiro() {
  return (
    <svg {...base}>
      <rect x="3" y="6" width="18" height="12" rx="2.2" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M6.6 12h.01M17.4 12h.01" />
    </svg>
  );
}

export function IconeTrabalho() {
  return (
    <svg {...base}>
      <path d="M4 6.5 5.7 8.2 9 5" />
      <path d="M4 13.5 5.7 15.2 9 12" />
      <path d="M4 20.2 5.7 21.9 9 18.7" />
      <path d="M12.5 6.6H21M12.5 13.6H21M12.5 20.3H21" />
    </svg>
  );
}

export function IconeAjustes() {
  return (
    <svg {...base}>
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 2.6v2.2M12 19.2v2.2M21.4 12h-2.2M4.8 12H2.6M18.6 5.4l-1.6 1.6M7 17l-1.6 1.6M18.6 18.6 17 17M7 7 5.4 5.4" />
    </svg>
  );
}
