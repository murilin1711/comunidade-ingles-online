
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { FiltrosAulas, AulaHistorico, EstatisticasPresenca } from './types';

export const useAulasStats = () => {
  const [historicoAulas, setHistoricoAulas] = useState<AulaHistorico[]>([]);
  const [estatisticasPresenca, setEstatisticasPresenca] = useState<EstatisticasPresenca>({
    taxaPresenca: 0,
    faltasSemAviso: 0,
    faltasComAviso: 0
  });
  const [loading, setLoading] = useState(false);

  const fetchHistoricoAulas = useCallback(async (filtros: FiltrosAulas) => {
    setLoading(true);
    try {
      let query = supabase
        .from('aulas')
        .select(`
          id,
          dia_semana,
          horario,
          nivel,
          capacidade,
          professor_nome,
          professor_id,
          data_aula,
          ativa,
          inscricoes_abertas,
          inscricoes!inscricoes_aula_id_fkey(
            id,
            status,
            presenca,
            timestamp_inscricao,
            cancelamento,
            motivo_cancelamento,
            aluno_id,
            aluno:alunos!inscricoes_aluno_id_fkey(nome, matricula, email)
          ),
          avisos_falta!avisos_falta_aula_id_fkey(
            id,
            aluno_id,
            aula_id,
            status,
            motivo
          )
        `)
        // Remover filtro .eq('ativa', true) para buscar TODAS as aulas incluindo inativas
        .order('data_aula', { ascending: false })
        .order('horario', { ascending: true });

      if (filtros.nivel && filtros.nivel !== 'todos') {
        query = query.eq('nivel', filtros.nivel);
      }

      if (filtros.professor && filtros.professor !== 'todos') {
        query = query.eq('professor_id', filtros.professor);
      }

      if (filtros.dataInicio) {
        query = query.gte('data_aula', filtros.dataInicio);
      }

      if (filtros.dataFim) {
        query = query.lte('data_aula', filtros.dataFim);
      }

      const { data: aulasData, error } = await query;

      if (error) throw error;

      // Processar dados das aulas
      const aulasProcessadas = aulasData?.map(aula => {
        const inscricoes = aula.inscricoes || [];
        const avisosFalta = aula.avisos_falta || [];
        
        // Separar inscrições ativas das canceladas
        const inscricoesAtivas = inscricoes.filter(i => i.cancelamento === null);
        const inscricoesCanceladas = inscricoes.filter(i => i.cancelamento !== null);
        
        // Filtrar confirmados das inscrições ativas
        const confirmados = inscricoesAtivas.filter(i => i.status === 'confirmado');
        const presentes = confirmados.filter(i => i.presenca === true);
        const faltas = confirmados.filter(i => i.presenca === false);
        const listaEspera = inscricoesAtivas.filter(i => i.status === 'espera');
        
        // Identificar faltas com aviso (inscrições canceladas por aviso de falta)
        const faltasComAviso = inscricoesCanceladas.filter(i => 
          i.motivo_cancelamento?.includes('Aviso de falta')
        );

        return {
          ...aula,
          confirmados,
          presentes,
          faltas,
          listaEspera,
          avisosFalta,
          faltasComAviso: faltasComAviso.length
        };
      }) || [];

      setHistoricoAulas(aulasProcessadas);

      // Calcular estatísticas de presença mais precisas
      const totalConfirmados = aulasProcessadas.reduce((acc, aula) => acc + (aula.confirmados?.length || 0), 0);
      const totalPresentes = aulasProcessadas.reduce((acc, aula) => acc + (aula.presentes?.length || 0), 0);
      const totalFaltas = aulasProcessadas.reduce((acc, aula) => acc + (aula.faltas?.length || 0), 0);
      const totalFaltasComAviso = aulasProcessadas.reduce((acc, aula) => acc + (aula.faltasComAviso || 0), 0);
      
      // Contar avisos de falta processados
      const { data: avisosFaltaData } = await supabase
        .from('avisos_falta')
        .select('id, status')
        .in('aula_id', aulasProcessadas.map(aula => aula.id))
        .eq('status', 'aplicado');

      const faltasComAvisoProcessadas = (avisosFaltaData?.length || 0) + totalFaltasComAviso;
      const faltasSemAvisoCount = Math.max(0, totalFaltas - faltasComAvisoProcessadas);

      setEstatisticasPresenca({
        taxaPresenca: totalConfirmados > 0 ? Math.round((totalPresentes / totalConfirmados) * 100) : 0,
        faltasSemAviso: faltasSemAvisoCount,
        faltasComAviso: faltasComAvisoProcessadas
      });

    } catch (error) {
      console.error('Erro ao buscar histórico de aulas:', error);
      toast.error('Erro ao carregar histórico de aulas');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    historicoAulas,
    estatisticasPresenca,
    loading,
    fetchHistoricoAulas
  };
};
