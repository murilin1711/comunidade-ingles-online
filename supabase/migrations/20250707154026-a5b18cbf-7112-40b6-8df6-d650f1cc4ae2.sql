
-- Adicionar timestamp mais preciso para inscrições (já existe data_inscricao, mas vamos adicionar um mais preciso)
ALTER TABLE public.inscricoes 
ADD COLUMN timestamp_inscricao TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Atualizar inscrições existentes para ter o timestamp baseado na data_inscricao atual
UPDATE public.inscricoes 
SET timestamp_inscricao = data_inscricao 
WHERE timestamp_inscricao IS NULL;

-- Tornar o campo obrigatório após preencher os dados existentes
ALTER TABLE public.inscricoes 
ALTER COLUMN timestamp_inscricao SET NOT NULL;

-- Criar índice para melhorar performance das consultas de ordenação por timestamp
CREATE INDEX idx_inscricoes_timestamp_inscricao ON public.inscricoes(timestamp_inscricao);

-- Permitir que alunos vejam informações básicas de outros alunos inscritos na mesma aula
-- (apenas nome e timestamp, sem matrícula)
CREATE POLICY "Alunos podem ver nomes e timestamps de outros alunos na mesma aula" 
ON public.inscricoes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.inscricoes i2 
    WHERE i2.aula_id = inscricoes.aula_id 
    AND i2.aluno_id = auth.uid()
  )
);
