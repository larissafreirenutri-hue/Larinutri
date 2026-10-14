"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type EstadoPrimeiroAcesso = { erro?: string };

/**
 * Consome o convite e cria a conta do paciente com a senha que ele
 * mesmo definiu. Roda com a Secret key para enxergar o convite e
 * vincular o registro, depois loga o paciente e leva ao portal. A
 * Larissa nunca digita a senha por ele.
 */
export async function definirSenha(
  _anterior: EstadoPrimeiroAcesso,
  formData: FormData,
): Promise<EstadoPrimeiroAcesso> {
  const token = String(formData.get("token") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const confirma = String(formData.get("confirma") ?? "");

  if (!token) return { erro: "Link inválido. Peça um novo para a Larissa." };
  if (senha.length < 8) {
    return { erro: "A senha precisa ter pelo menos 8 caracteres." };
  }
  if (senha !== confirma) {
    return { erro: "As senhas não são iguais. Confira e tente de novo." };
  }

  const admin = createAdminClient();

  const { data: convite } = await admin
    .from("patient_invites")
    .select("id, patient_id, expira_em, consumido_em")
    .eq("token", token)
    .maybeSingle();

  if (!convite || convite.consumido_em) {
    return {
      erro: "Este link não é mais válido ou já foi usado. Peça um novo para a Larissa.",
    };
  }
  if (new Date(convite.expira_em).getTime() < Date.now()) {
    return { erro: "Este link expirou. Peça um novo para a Larissa." };
  }

  const { data: paciente } = await admin
    .from("patients")
    .select("id, email, auth_user_id")
    .eq("id", convite.patient_id)
    .maybeSingle();

  if (!paciente || !paciente.email) {
    return { erro: "Não foi possível concluir. Fale com a Larissa." };
  }
  if (paciente.auth_user_id) {
    return {
      erro: "Este acesso já foi ativado. Use a tela de entrar com a sua senha.",
    };
  }

  // Cria a conta já com o papel paciente no app_metadata, que é só
  // gravável pelo servidor e viaja no JWT para o proxy rotear.
  const { data: criado, error: erroCriar } = await admin.auth.admin.createUser({
    email: paciente.email,
    password: senha,
    email_confirm: true,
    app_metadata: { role: "paciente" },
  });

  if (erroCriar || !criado?.user) {
    return {
      erro: "Não foi possível criar o seu acesso. Pode já existir uma conta com este e-mail. Fale com a Larissa.",
    };
  }

  const userId = criado.user.id;

  await admin.from("profiles").upsert({ user_id: userId, role: "paciente" });

  const { error: erroVinculo } = await admin
    .from("patients")
    .update({ auth_user_id: userId, acesso_status: "ativo" })
    .eq("id", paciente.id);

  if (erroVinculo) {
    // Desfaz a conta para não deixar um usuário órfão sem vínculo.
    await admin.auth.admin.deleteUser(userId);
    return { erro: "Não foi possível concluir. Tente de novo em instantes." };
  }

  await admin
    .from("patient_invites")
    .update({ consumido_em: new Date().toISOString() })
    .eq("id", convite.id);

  // Loga o paciente de verdade, pelo cliente de cookie, e leva ao portal.
  const supabase = await createClient();
  const { error: erroLogin } = await supabase.auth.signInWithPassword({
    email: paciente.email,
    password: senha,
  });

  if (erroLogin) {
    // Conta criada, só o login automático falhou. Manda para a tela de entrar.
    redirect("/entrar?novo=1");
  }

  // novo=1 faz a área mostrar, uma vez, o aviso com o endereço de login.
  redirect("/meu-acompanhamento?novo=1");
}
