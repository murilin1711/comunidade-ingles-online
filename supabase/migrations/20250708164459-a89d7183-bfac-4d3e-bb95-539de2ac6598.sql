-- Adicionar configuração para regra de uma aula por semana
ALTER TABLE public.configuracoes_sistema 
ADD COLUMN regra_uma_aula_semana BOOLEAN NOT NULL DEFAULT true;