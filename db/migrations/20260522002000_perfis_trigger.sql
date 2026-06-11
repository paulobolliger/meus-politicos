-- Trigger: criar perfil automaticamente quando usuário se cadastra no Supabase Auth
-- Lê nome de raw_user_meta_data (Google, LinkedIn, email/senha)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nome text;
BEGIN
  -- Tentar extrair nome do metadata OAuth (Google: full_name, LinkedIn: full_name, etc.)
  v_nome := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'given_name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.perfis (id, nome, criado_em, atualizado_em)
  VALUES (NEW.id, v_nome, now(), now())
  ON CONFLICT (id) DO UPDATE
    SET nome = CASE
      WHEN perfis.nome IS NULL OR perfis.nome = split_part(NEW.email, '@', 1)
      THEN EXCLUDED.nome
      ELSE perfis.nome  -- não sobrescreve nome já preenchido pelo usuário
    END,
    atualizado_em = now();

  RETURN NEW;
END;
$$;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger no INSERT de auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Corrigir nome do usuário existente (Paulo Bolliger via Google OAuth)
UPDATE public.perfis
SET nome = COALESCE(
  (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE auth.users.id = perfis.id),
  (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE auth.users.id = perfis.id),
  nome
),
atualizado_em = now()
WHERE nome IS NULL OR nome IN (
  SELECT split_part(email, '@', 1) FROM auth.users WHERE auth.users.id = perfis.id
);
