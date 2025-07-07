-- Corrigir política RLS que causa recursão infinita
-- Primeiro, remover a política problemática
DROP POLICY IF EXISTS "Alunos podem ver nomes e timestamps de outros alunos na mesma a" ON public.inscricoes;

-- Criar função security definer para verificar se aluno está inscrito na aula
CREATE OR REPLACE FUNCTION public.aluno_inscrito_na_aula(aula_uuid uuid, aluno_uuid uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.inscricoes 
    WHERE aula_id = aula_uuid 
    AND aluno_id = aluno_uuid 
    AND cancelamento IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recriar a política usando a função security definer
CREATE POLICY "Alunos podem ver outros alunos da mesma aula"
ON public.inscricoes 
FOR SELECT 
USING (public.aluno_inscrito_na_aula(aula_id, auth.uid()));

-- Atualizar a lógica de status automático baseado na capacidade
-- Criar função para determinar status da inscrição baseado na ordem de chegada
CREATE OR REPLACE FUNCTION public.determinar_status_inscricao(aula_uuid uuid)
RETURNS TEXT AS $$
DECLARE
  capacidade_aula INTEGER;
  total_confirmados INTEGER;
BEGIN
  -- Buscar capacidade da aula
  SELECT capacidade INTO capacidade_aula
  FROM public.aulas
  WHERE id = aula_uuid;
  
  -- Contar inscrições confirmadas não canceladas
  SELECT COUNT(*) INTO total_confirmados
  FROM public.inscricoes
  WHERE aula_id = aula_uuid 
  AND status = 'confirmado'
  AND cancelamento IS NULL;
  
  -- Retornar status baseado na capacidade
  IF total_confirmados < capacidade_aula THEN
    RETURN 'confirmado';
  ELSE
    RETURN 'espera';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;