-- Criar função para obter tempo do servidor
CREATE OR REPLACE FUNCTION public.get_server_time()
RETURNS timestamp with time zone
LANGUAGE sql
STABLE
AS $$
  SELECT now();
$$;

-- Permitir acesso público à função
GRANT EXECUTE ON FUNCTION public.get_server_time() TO anon, authenticated;