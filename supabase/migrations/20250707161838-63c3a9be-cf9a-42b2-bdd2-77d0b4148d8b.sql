-- Adicionar política RLS para permitir que professores vejam dados dos alunos inscritos em suas aulas
CREATE POLICY "Professores podem ver dados dos alunos inscritos em suas aulas" 
ON public.alunos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.inscricoes i
    JOIN public.aulas a ON i.aula_id = a.id
    WHERE i.aluno_id = alunos.user_id 
    AND a.professor_id = auth.uid()
    AND i.cancelamento IS NULL
  )
);