import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ConfiguracoesSistema {
  diaLiberacao: number;
  horarioLiberacao: string;
  mensagemPeriodoInscricao: string;
  mensagemRegrasSuspensao: string;
  horasMinimaBaixaCansulamento: number;
}

export const useConfiguracoesAluno = () => {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesSistema | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfiguracoes = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('dia_liberacao, horario_liberacao, mensagem_periodo_inscricao, mensagem_regras_suspensao, horas_minima_baixa_cancelamento')
        .order('atualizado_em', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfiguracoes({
          diaLiberacao: data.dia_liberacao,
          horarioLiberacao: data.horario_liberacao,
          mensagemPeriodoInscricao: data.mensagem_periodo_inscricao,
          mensagemRegrasSuspensao: data.mensagem_regras_suspensao,
          horasMinimaBaixaCansulamento: data.horas_minima_baixa_cancelamento
        });
      } else {
        // Valores padrão caso não existam configurações
        setConfiguracoes({
          diaLiberacao: 1, // Segunda-feira
          horarioLiberacao: '12:30',
          mensagemPeriodoInscricao: 'As inscrições abrem toda segunda-feira às 12:30.',
          mensagemRegrasSuspensao: 'Faltas sem aviso resultam em suspensão de 4 semanas.',
          horasMinimaBaixaCansulamento: 4
        });
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      // Usar valores padrão em caso de erro
      setConfiguracoes({
        diaLiberacao: 1,
        horarioLiberacao: '12:30',
        mensagemPeriodoInscricao: 'As inscrições abrem toda segunda-feira às 12:30.',
        mensagemRegrasSuspensao: 'Faltas sem aviso resultam em suspensão de 4 semanas.',
        horasMinimaBaixaCansulamento: 4
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfiguracoes();

    // Escutar mudanças em tempo real nas configurações
    const channel = supabase
      .channel('configuracoes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'configuracoes_sistema'
        },
        () => {
          fetchConfiguracoes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getDiaSemanaTexto = () => {
    if (!configuracoes) return 'segunda-feira';
    
    const dias = [
      'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
      'quinta-feira', 'sexta-feira', 'sábado'
    ];
    
    return dias[configuracoes.diaLiberacao] || 'segunda-feira';
  };

  const getMensagemInscricaoFechada = () => {
    const diaSemana = getDiaSemanaTexto();
    const horario = configuracoes?.horarioLiberacao || '12:30';
    
    return `Inscrições fechadas: As inscrições estão fechadas no momento. Aguarde até ${diaSemana} às ${horario} para se inscrever nas aulas.`;
  };

  const isInscricaoAberta = () => {
    if (!configuracoes) return false;
    
    const agora = new Date();
    const diaSemana = agora.getDay(); // 0 = domingo, 1 = segunda, etc.
    const hora = agora.getHours();
    const minutos = agora.getMinutes();
    
    // Convertir horário configurado para números
    const [horaConfig, minutoConfig] = configuracoes.horarioLiberacao.split(':').map(Number);
    
    // Verificar se é o dia e horário configurado ou depois
    return diaSemana === configuracoes.diaLiberacao && 
           (hora > horaConfig || (hora === horaConfig && minutos >= minutoConfig));
  };

  return {
    configuracoes,
    loading,
    getDiaSemanaTexto,
    getMensagemInscricaoFechada,
    isInscricaoAberta
  };
};