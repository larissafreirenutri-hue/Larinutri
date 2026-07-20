export type Paciente = {
  id: string;
  owner: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  access_token: string;
  created_at: string;
  // Campos do modelo rico, acrescentados na migração 0007.
  objetivo?: string | null;
  plano_nome?: string | null;
  plano_duracao?: string | null;
  plano_vence?: string | null;
  restricao?: string | null;
  status?: string | null;
  peso_inicial?: number | null;
  altura?: number | null;
  sono_habitual?: string | null;
  treino_planejado?: string | null;
  meta_agua?: string | null;
};

export type Checkin = {
  id: string;
  patient_id: string;
  peso_kg: number | null;
  adesao_plano: number | null;
  adesao_plano_texto?: string | null;
  qualidade_sono: string | null;
  nivel_fome: string | null;
  dias_atividade_fisica: number | null;
  semana?: number | null;
  saciedade?: number | null;
  controle_vontade?: number | null;
  hidratacao?: number | null;
  digestao?: number | null;
  sono?: number | null;
  recuperacao_energia?: number | null;
  humor?: number | null;
  tranquilidade?: number | null;
  semana_geral?: number | null;
  alerta_clinico?: string | null;
  refeicao_livre?: boolean | null;
  refeicao_livre_qtd?: number | null;
  refeicao_livre_oque?: string | null;
  fotos?: string[] | null;
  atividade_quais?: string | null;
  observacoes: string | null;
  created_at: string;
};

/** Check-in com o nome do paciente embutido pelo join do PostgREST. */
export type CheckinComPaciente = Checkin & {
  patients: { id: string; full_name: string } | null;
};

/** Campos que o formulário do painel edita. */
export type PacienteEditavel = Pick<
  Paciente,
  "full_name" | "email" | "phone" | "notes"
>;
