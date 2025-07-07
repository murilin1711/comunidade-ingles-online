-- Criar trigger para verificar inscrição semanal antes de inserir
CREATE OR REPLACE FUNCTION public.check_inscricao_semanal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se o aluno já tem inscrição na mesma semana
  IF verificar_inscricao_semanal(NEW.aluno_id, NEW.aula_id) THEN
    RAISE EXCEPTION 'Aluno já possui inscrição em aula nesta semana. Apenas uma inscrição por semana é permitida.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger que executa antes de inserir nova inscrição
CREATE TRIGGER trigger_check_inscricao_semanal
  BEFORE INSERT ON public.inscricoes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_inscricao_semanal();