-- Criar função para verificar se aluno já tem inscrição na mesma semana
CREATE OR REPLACE FUNCTION public.verificar_inscricao_semanal(aluno_uuid uuid, aula_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  data_aula_nova DATE;
  inicio_semana DATE;
  fim_semana DATE;
  inscricoes_existentes INTEGER;
BEGIN
  -- Buscar a data da aula que o aluno quer se inscrever
  SELECT data_aula INTO data_aula_nova
  FROM public.aulas
  WHERE id = aula_uuid;
  
  -- Se não há data definida, considerar a próxima ocorrência do dia da semana
  IF data_aula_nova IS NULL THEN
    SELECT 
      CASE 
        WHEN dia_semana >= EXTRACT(dow FROM CURRENT_DATE) THEN
          CURRENT_DATE + (dia_semana - EXTRACT(dow FROM CURRENT_DATE))
        ELSE
          CURRENT_DATE + (dia_semana - EXTRACT(dow FROM CURRENT_DATE) + 7)
      END INTO data_aula_nova
    FROM public.aulas
    WHERE id = aula_uuid;
  END IF;
  
  -- Calcular início e fim da semana (domingo a sábado)
  inicio_semana := data_aula_nova - EXTRACT(dow FROM data_aula_nova);
  fim_semana := inicio_semana + 6;
  
  -- Verificar se o aluno já tem inscrições ativas na mesma semana
  SELECT COUNT(*) INTO inscricoes_existentes
  FROM public.inscricoes i
  JOIN public.aulas a ON i.aula_id = a.id
  WHERE i.aluno_id = aluno_uuid
    AND i.cancelamento IS NULL
    AND (
      -- Se a aula tem data específica, verificar na semana
      (a.data_aula IS NOT NULL AND a.data_aula BETWEEN inicio_semana AND fim_semana)
      OR
      -- Se não tem data específica, verificar se é na mesma semana que a nova aula
      (a.data_aula IS NULL AND 
        CASE 
          WHEN a.dia_semana >= EXTRACT(dow FROM CURRENT_DATE) THEN
            CURRENT_DATE + (a.dia_semana - EXTRACT(dow FROM CURRENT_DATE))
          ELSE
            CURRENT_DATE + (a.dia_semana - EXTRACT(dow FROM CURRENT_DATE) + 7)
        END BETWEEN inicio_semana AND fim_semana
      )
    );
  
  -- Retornar true se já tem inscrição na semana, false caso contrário
  RETURN inscricoes_existentes > 0;
END;
$$;