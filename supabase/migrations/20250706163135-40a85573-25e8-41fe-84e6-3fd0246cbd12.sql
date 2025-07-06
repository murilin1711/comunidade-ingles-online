
-- Adicionar coluna nivel na tabela aulas
ALTER TABLE public.aulas 
ADD COLUMN nivel text CHECK (nivel IN ('Upper', 'Lower'));

-- Definir um valor padrão para aulas existentes
UPDATE public.aulas 
SET nivel = 'Upper' 
WHERE nivel IS NULL;

-- Tornar a coluna obrigatória
ALTER TABLE public.aulas 
ALTER COLUMN nivel SET NOT NULL;
