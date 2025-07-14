-- 1. Resolver problema de foreign key constraint ao deletar aulas
-- Alteramos a constraint para permitir CASCADE DELETE

-- Primeiro removemos a constraint existente
ALTER TABLE public.avisos_falta DROP CONSTRAINT IF EXISTS avisos_falta_aula_id_fkey;

-- Adicionamos a nova constraint com CASCADE DELETE
ALTER TABLE public.avisos_falta 
ADD CONSTRAINT avisos_falta_aula_id_fkey 
FOREIGN KEY (aula_id) 
REFERENCES public.aulas(id) 
ON DELETE CASCADE;