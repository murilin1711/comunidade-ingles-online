-- Criar tabela separada para administradores
CREATE TABLE public.administradores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  matricula TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mover dados dos admins da tabela professores para administradores
INSERT INTO public.administradores (user_id, matricula, nome, telefone, email, criado_em, atualizado_em)
SELECT user_id, matricula, nome, telefone, email, criado_em, atualizado_em 
FROM public.professores 
WHERE role = 'admin';

-- Remover políticas antigas que dependem da coluna role
DROP POLICY IF EXISTS "Apenas admins podem ver configurações" ON public.configuracoes_sistema;
DROP POLICY IF EXISTS "Apenas admins podem atualizar configurações" ON public.configuracoes_sistema;
DROP POLICY IF EXISTS "Apenas admins podem criar configurações" ON public.configuracoes_sistema;

-- Remover admins da tabela professores
DELETE FROM public.professores WHERE role = 'admin';

-- Remover coluna role da tabela professores (agora só terá professores)
ALTER TABLE public.professores DROP COLUMN role;

-- Habilitar RLS na nova tabela
ALTER TABLE public.administradores ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para administradores
CREATE POLICY "Administradores podem ver seus próprios dados" 
ON public.administradores 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Administradores podem atualizar seus próprios dados" 
ON public.administradores 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Permitir inserção de novos administradores" 
ON public.administradores 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Criar novas políticas para configuracoes_sistema usando a nova tabela
CREATE POLICY "Apenas admins podem ver configurações" 
ON public.configuracoes_sistema 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.administradores 
  WHERE administradores.user_id = auth.uid()
));

CREATE POLICY "Apenas admins podem atualizar configurações" 
ON public.configuracoes_sistema 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.administradores 
  WHERE administradores.user_id = auth.uid()
));

CREATE POLICY "Apenas admins podem criar configurações" 
ON public.configuracoes_sistema 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.administradores 
  WHERE administradores.user_id = auth.uid()
));

-- Criar trigger para atualizar updated_at na tabela administradores
CREATE TRIGGER update_administradores_updated_at
BEFORE UPDATE ON public.administradores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();