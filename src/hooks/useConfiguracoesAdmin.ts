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
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setConfiguracoes({
          id: data.id,
          faltaComAvisoMais4h: data.falta_com_aviso_mais_4h,
          faltaComAvisoMenos4h: data.falta_com_aviso_menos_4h,
          faltaSemAviso: data.falta_sem_aviso,
          horasMinimaBaixaCansulamento: data.horas_minima_baixa_cancelamento,
          diaLiberacao: data.dia_liberacao,
          horarioLiberacao: data.horario_liberacao,
          mensagemPeriodoInscricao: data.mensagem_periodo_inscricao,
          mensagemRegrasSuspensao: data.mensagem_regras_suspensao
        });
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
      const dbData = {
        falta_com_aviso_mais_4h: novasConfiguracoes.faltaComAvisoMais4h,
        falta_com_aviso_menos_4h: novasConfiguracoes.faltaComAvisoMenos4h,
        falta_sem_aviso: novasConfiguracoes.faltaSemAviso,
        horas_minima_baixa_cancelamento: novasConfiguracoes.horasMinimaBaixaCansulamento,
        dia_liberacao: novasConfiguracoes.diaLiberacao,
        horario_liberacao: novasConfiguracoes.horarioLiberacao,
        mensagem_periodo_inscricao: novasConfiguracoes.mensagemPeriodoInscricao,
        mensagem_regras_suspensao: novasConfiguracoes.mensagemRegrasSuspensao
      };
      
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .upsert(dbData)
        .select()
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const mappedData = {
          id: data.id,
          faltaComAvisoMais4h: data.falta_com_aviso_mais_4h,
          faltaComAvisoMenos4h: data.falta_com_aviso_menos_4h,
          faltaSemAviso: data.falta_sem_aviso,
          horasMinimaBaixaCansulamento: data.horas_minima_baixa_cancelamento,
          diaLiberacao: data.dia_liberacao,
          horarioLiberacao: data.horario_liberacao,
          mensagemPeriodoInscricao: data.mensagem_periodo_inscricao,
          mensagemRegrasSuspensao: data.mensagem_regras_suspensao
        };
        setConfiguracoes(mappedData);
        return mappedData;
      }
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