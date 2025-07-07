-- Permitir que administradores gerenciem todas as aulas (inserir, atualizar, visualizar)
CREATE POLICY "Administradores podem gerenciar todas as aulas" 
ON public.aulas 
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 
  FROM public.administradores 
  WHERE administradores.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 
  FROM public.administradores 
  WHERE administradores.user_id = auth.uid()
));

-- Permitir que administradores vejam todas as inscrições
CREATE POLICY "Administradores podem ver todas as inscrições" 
ON public.inscricoes 
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 
  FROM public.administradores 
  WHERE administradores.user_id = auth.uid()
));

-- Permitir que administradores gerenciem todas as inscrições
CREATE POLICY "Administradores podem gerenciar todas as inscrições" 
ON public.inscricoes 
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 
  FROM public.administradores 
  WHERE administradores.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 
  FROM public.administradores 
  WHERE administradores.user_id = auth.uid()
));

-- Permitir que administradores vejam todos os alunos
CREATE POLICY "Administradores podem ver todos os alunos" 
ON public.alunos 
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 
  FROM public.administradores 
  WHERE administradores.user_id = auth.uid()
));

-- Permitir que administradores gerenciem suspensões
CREATE POLICY "Administradores podem gerenciar suspensões" 
ON public.suspensoes 
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 
  FROM public.administradores 
  WHERE administradores.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 
  FROM public.administradores 
  WHERE administradores.user_id = auth.uid()
));

-- Permitir que administradores vejam participações
CREATE POLICY "Administradores podem ver participações" 
ON public.participacoes 
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 
  FROM public.administradores 
  WHERE administradores.user_id = auth.uid()
));