-- Criar política para permitir alunos verem inscrições confirmadas de aulas ativas para calcular vagas corretamente
DROP POLICY IF EXISTS "Alunos podem ver outros alunos da mesma aula" ON public.inscricoes;

-- Nova política mais permissiva para alunos verem inscrições confirmadas de aulas ativas
CREATE POLICY "Alunos podem ver inscrições confirmadas de aulas ativas" 
ON public.inscricoes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.aulas a 
    WHERE a.id = inscricoes.aula_id 
    AND a.ativa = true
  )
  AND inscricoes.status = 'confirmado'
  AND inscricoes.cancelamento IS NULL
);

-- Manter política para alunos verem suas próprias inscrições (todas, não apenas confirmadas)
CREATE POLICY "Alunos podem ver todas suas inscrições" 
ON public.inscricoes 
FOR SELECT 
USING (aluno_id = auth.uid());