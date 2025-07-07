-- Create table for tracking absence warnings
CREATE TABLE public.avisos_falta (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id UUID NOT NULL,
  aula_id UUID NOT NULL,
  data_aviso TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pendente',
  tipo_suspensao TEXT,
  semanas_suspensao INTEGER,
  data_aplicacao TIMESTAMP WITH TIME ZONE,
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.avisos_falta ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Alunos podem criar avisos para si mesmos" 
ON public.avisos_falta 
FOR INSERT 
WITH CHECK (aluno_id = auth.uid());

CREATE POLICY "Alunos podem ver seus próprios avisos" 
ON public.avisos_falta 
FOR SELECT 
USING (aluno_id = auth.uid());

CREATE POLICY "Admins podem ver todos os avisos" 
ON public.avisos_falta 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM administradores 
  WHERE administradores.user_id = auth.uid()
));

CREATE POLICY "Admins podem atualizar avisos" 
ON public.avisos_falta 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM administradores 
  WHERE administradores.user_id = auth.uid()
));

-- Add trigger for updating timestamps
CREATE TRIGGER update_avisos_falta_updated_at
BEFORE UPDATE ON public.avisos_falta
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraints
ALTER TABLE public.avisos_falta 
ADD CONSTRAINT avisos_falta_aluno_id_fkey 
FOREIGN KEY (aluno_id) REFERENCES public.alunos(user_id);

ALTER TABLE public.avisos_falta 
ADD CONSTRAINT avisos_falta_aula_id_fkey 
FOREIGN KEY (aula_id) REFERENCES public.aulas(id);

-- Create index for performance
CREATE INDEX idx_avisos_falta_status ON public.avisos_falta(status);
CREATE INDEX idx_avisos_falta_data_aviso ON public.avisos_falta(data_aviso);