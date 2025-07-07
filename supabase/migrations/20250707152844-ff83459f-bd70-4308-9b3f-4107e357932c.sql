
-- Adicionar coluna data_aula na tabela aulas para armazenar a data específica da aula
ALTER TABLE public.aulas 
ADD COLUMN data_aula DATE;

-- Criar índice para melhorar performance nas consultas de histórico
CREATE INDEX idx_aulas_data_aula ON public.aulas(data_aula);

-- Atualizar as aulas existentes com uma data padrão baseada no dia da semana
-- (opcional - pode deixar NULL para aulas já criadas)
UPDATE public.aulas 
SET data_aula = CURRENT_DATE + (dia_semana - EXTRACT(DOW FROM CURRENT_DATE))::INTEGER
WHERE data_aula IS NULL AND ativa = true;
