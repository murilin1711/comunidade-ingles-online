-- Permitir que administradores vejam todos os professores
CREATE POLICY "Administradores podem ver todos os professores" 
ON public.professores 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 
  FROM public.administradores 
  WHERE administradores.user_id = auth.uid()
));