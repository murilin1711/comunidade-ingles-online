-- Adicionar campo para controlar status das inscrições
ALTER TABLE public.aulas 
ADD COLUMN inscricoes_abertas BOOLEAN NOT NULL DEFAULT true;

-- Atualizar aulas existentes para manter compatibilidade
UPDATE public.aulas 
SET inscricoes_abertas = true 
WHERE ativa = true;