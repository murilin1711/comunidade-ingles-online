-- Atualizar política para permitir alunos verem todas as inscrições de aulas ativas (não apenas confirmadas)
DROP POLICY IF EXISTS "Alunos podem ver inscrições confirmadas de aulas ativas" ON public.inscricoes;

-- Nova política mais ampla para ver todas as inscrições de aulas ativas
CREATE POLICY "Alunos podem ver todas inscrições de aulas ativas" 
ON public.inscricoes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.aulas a 
    WHERE a.id = inscricoes.aula_id 
    AND a.ativa = true
  )
  AND inscricoes.cancelamento IS NULL
);