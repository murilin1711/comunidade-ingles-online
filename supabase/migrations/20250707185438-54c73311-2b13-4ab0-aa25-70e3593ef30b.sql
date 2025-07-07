-- Criar política para permitir que alunos vejam dados de outros alunos da mesma aula
CREATE POLICY "Alunos podem ver dados de outros alunos da mesma aula" 
ON public.alunos 
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.inscricoes i1, public.inscricoes i2
    WHERE i1.aluno_id = auth.uid() 
    AND i2.aluno_id = alunos.user_id
    AND i1.aula_id = i2.aula_id
    AND i1.cancelamento IS NULL
    AND i2.cancelamento IS NULL
  )
);