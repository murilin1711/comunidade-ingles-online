-- Adicionar coluna motivo para armazenar o motivo da falta escrito pelo aluno
ALTER TABLE public.avisos_falta 
ADD COLUMN IF NOT EXISTS motivo text;