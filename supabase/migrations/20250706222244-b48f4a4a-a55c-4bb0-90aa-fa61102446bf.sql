-- Adicionar role de admin
ALTER TABLE public.alunos ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.alunos DROP CONSTRAINT IF EXISTS alunos_role_check;
ALTER TABLE public.alunos ADD CONSTRAINT alunos_role_check CHECK (role IN ('aluno', 'admin'));
ALTER TABLE public.alunos ALTER COLUMN role SET DEFAULT 'aluno'::text;

ALTER TABLE public.professores ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.professores DROP CONSTRAINT IF EXISTS professores_role_check;
ALTER TABLE public.professores ADD CONSTRAINT professores_role_check CHECK (role IN ('professor', 'admin'));
ALTER TABLE public.professores ALTER COLUMN role SET DEFAULT 'professor'::text;

-- Criar tabela de configurações do sistema
CREATE TABLE public.configuracoes_sistema (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  falta_com_aviso_mais_4h integer NOT NULL DEFAULT 2,
  falta_com_aviso_menos_4h integer NOT NULL DEFAULT 3,
  falta_sem_aviso integer NOT NULL DEFAULT 4,
  horas_minima_baixa_cancelamento integer NOT NULL DEFAULT 4,
  dia_liberacao integer NOT NULL DEFAULT 1 CHECK (dia_liberacao >= 0 AND dia_liberacao <= 6),
  horario_liberacao time NOT NULL DEFAULT '12:30',
  mensagem_periodo_inscricao text NOT NULL DEFAULT 'As inscrições abrem toda segunda-feira às 12:30.',
  mensagem_regras_suspensao text NOT NULL DEFAULT 'Faltas sem aviso resultam em suspensão de 4 semanas.',
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.configuracoes_sistema ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Apenas admins podem ver configurações" 
ON public.configuracoes_sistema 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.alunos WHERE user_id = auth.uid() AND role = 'admin'
  ) OR
  EXISTS (
    SELECT 1 FROM public.professores WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Apenas admins podem criar configurações" 
ON public.configuracoes_sistema 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.alunos WHERE user_id = auth.uid() AND role = 'admin'
  ) OR
  EXISTS (
    SELECT 1 FROM public.professores WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Apenas admins podem atualizar configurações" 
ON public.configuracoes_sistema 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.alunos WHERE user_id = auth.uid() AND role = 'admin'
  ) OR
  EXISTS (
    SELECT 1 FROM public.professores WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Inserir configurações padrão
INSERT INTO public.configuracoes_sistema (
  falta_com_aviso_mais_4h,
  falta_com_aviso_menos_4h,
  falta_sem_aviso,
  horas_minima_baixa_cancelamento,
  dia_liberacao,
  horario_liberacao,
  mensagem_periodo_inscricao,
  mensagem_regras_suspensao
) VALUES (
  2,
  3,
  4,
  4,
  1,
  '12:30',
  'As inscrições abrem toda segunda-feira às 12:30.',
  'Faltas sem aviso resultam em suspensão de 4 semanas.'
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_configuracoes_sistema_updated_at
BEFORE UPDATE ON public.configuracoes_sistema
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();