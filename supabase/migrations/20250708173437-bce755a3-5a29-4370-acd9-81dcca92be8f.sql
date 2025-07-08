-- Adicionar campos para rastrear alterações de status das aulas
ALTER TABLE public.aulas 
ADD COLUMN status_alterado_por UUID REFERENCES auth.users(id),
ADD COLUMN status_alterado_em TIMESTAMP WITH TIME ZONE,
ADD COLUMN status_alterado_por_tipo TEXT CHECK (status_alterado_por_tipo IN ('admin', 'professor'));