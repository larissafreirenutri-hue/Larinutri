export type Paciente = {
  id: string;
  owner: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  access_token: string;
  created_at: string;
};

export type Checkin = {
  id: string;
  patient_id: string;
  peso_kg: number | null;
  adesao_plano: string | null;
  qualidade_sono: string | null;
  nivel_fome: string | null;
  dias_atividade_fisica: number | null;
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
