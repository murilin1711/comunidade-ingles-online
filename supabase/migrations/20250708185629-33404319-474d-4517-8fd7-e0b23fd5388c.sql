-- Corrigir o constraint da tabela suspensoes para aceitar os novos tipos de motivo
ALTER TABLE public.suspensoes 
DROP CONSTRAINT IF EXISTS suspensoes_motivo_check;

ALTER TABLE public.suspensoes 
ADD CONSTRAINT suspensoes_motivo_check 
CHECK (motivo = ANY (ARRAY[
  'cancelamento_4h'::text, 
  'cancelamento_menos_4h'::text, 
  'falta'::text,
  'aviso_4h'::text,
  'aviso_menos_4h'::text, 
  'falta_sem_aviso'::text
]));

-- Configurar realtime para as tabelas que precisam de atualizações automáticas
ALTER TABLE public.avisos_falta REPLICA IDENTITY FULL;
ALTER TABLE public.inscricoes REPLICA IDENTITY FULL;
ALTER TABLE public.suspensoes REPLICA IDENTITY FULL;

-- Adicionar as tabelas à publicação realtime
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'avisos_falta') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.avisos_falta;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'inscricoes') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.inscricoes;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'suspensoes') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.suspensoes;
    END IF;
END $$;