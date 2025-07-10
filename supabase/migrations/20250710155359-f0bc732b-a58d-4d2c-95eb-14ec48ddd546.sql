-- Adicionar política para administradores poderem atualizar dados de alunos
CREATE POLICY "Administradores podem atualizar dados de alunos" 
ON public.alunos 
FOR UPDATE 
USING (EXISTS ( SELECT 1 FROM administradores WHERE administradores.user_id = auth.uid()));