import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface ConfiguracoesSistema {
  id?: string;
  faltaComAvisoMais4h: number;
  faltaComAvisoMenos4h: number;
  faltaSemAviso: number;
  horasMinimaBaixaCansulamento: number;
  diaLiberacao: number;
  horarioLiberacao: string;
  mensagemPeriodoInscricao: string;
  mensagemRegrasSuspensao: string;
}

export const useConfiguracoesAdmin = () => {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesSistema | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchConfiguracoes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfiguracoes(data);
      } else {
        // Se não existir configuração, criar com valores padrão
        const configPadrao: ConfiguracoesSistema = {
          faltaComAvisoMais4h: 2,
          faltaComAvisoMenos4h: 3,
          faltaSemAviso: 4,
          horasMinimaBaixaCansulamento: 4,
          diaLiberacao: 1,
          horarioLiberacao: '12:30',
          mensagemPeriodoInscricao: 'As inscrições abrem toda segunda-feira às 12:30.',
          mensagemRegrasSuspensao: 'Faltas sem aviso resultam em suspensão de 4 semanas.'
        };
        setConfiguracoes(configPadrao);
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  }, []);

  const salvarConfiguracoes = useCallback(async (novasConfiguracoes: ConfiguracoesSistema) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .upsert(novasConfiguracoes)
        .select()
        .single();

      if (error) throw error;

      setConfiguracoes(data);
      return data;
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    configuracoes,
    loading,
    fetchConfiguracoes,
    salvarConfiguracoes
  };
};