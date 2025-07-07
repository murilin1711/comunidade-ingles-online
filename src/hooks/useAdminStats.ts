import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface FiltrosAulas {
  dataInicio: string;
  dataFim: string;
  professor: string;
  nivel: string;
}

interface FiltrosProfessores {
  periodo: string;
  nivel: string;
}

interface AulaHistorico {
  id: string;
  dia_semana: number;
  horario: string;
  nivel: string;
  capacidade: number;
  professor_nome: string;
  data_aula?: string;
  confirmados?: any[];
  presentes?: any[];
  faltas?: any[];
  listaEspera?: any[];
}

interface EstatisticasPresenca {
  taxaPresenca: number;
  faltasSemAviso: number;
  faltasComAviso: number;
}

interface EstatisticasProfessor {
  id: string;
  nome: string;
  totalAulas: number;
  totalVagas: number;
  alunosAtendidos: number;
  taxaOcupacao: number;
  mediaPresenca: number;
}

export const useAdminStats = () => {
  const [historicoAulas, setHistoricoAulas] = useState<AulaHistorico[]>([]);
  const [estatisticasPresenca, setEstatisticasPresenca] = useState<EstatisticasPresenca>({
    taxaPresenca: 0,
    faltasSemAviso: 0,
    faltasComAviso: 0
  });
  const [estatisticasProfessores, setEstatisticasProfessores] = useState<EstatisticasProfessor[]>([]);
  const [rankingProfessores, setRankingProfessores] = useState<EstatisticasProfessor[]>([]);
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
          inscricoes!inscricoes_aula_id_fkey(
            id,
            status,
            presenca,
            aluno:alunos!inscricoes_aluno_id_fkey(nome, matricula)
          )
        `)
        .eq('ativa', true)
        .order('dia_semana', { ascending: true })
        .order('horario', { ascending: true });

      if (filtros.nivel && filtros.nivel !== 'todos') {
        query = query.eq('nivel', filtros.nivel);
      }

      const { data: aulasData, error } = await query;

      if (error) throw error;

      // Processar dados das aulas
      const aulasProcessadas = aulasData?.map(aula => {
        const inscricoes = aula.inscricoes || [];
        const confirmados = inscricoes.filter(i => i.status === 'confirmado');
        const presentes = confirmados.filter(i => i.presenca === true);
        const faltas = confirmados.filter(i => i.presenca === false);
        const listaEspera = inscricoes.filter(i => i.status === 'espera');

        return {
          ...aula,
          confirmados,
          presentes,
          faltas,
          listaEspera
        };
      }) || [];

      setHistoricoAulas(aulasProcessadas);

      // Calcular estatísticas de presença
      const totalConfirmados = aulasProcessadas.reduce((acc, aula) => acc + (aula.confirmados?.length || 0), 0);
      const totalPresentes = aulasProcessadas.reduce((acc, aula) => acc + (aula.presentes?.length || 0), 0);
      const totalFaltas = aulasProcessadas.reduce((acc, aula) => acc + (aula.faltas?.length || 0), 0);

      setEstatisticasPresenca({
        taxaPresenca: totalConfirmados > 0 ? Math.round((totalPresentes / totalConfirmados) * 100) : 0,
        faltasSemAviso: Math.round(totalFaltas * 0.7), // Simulação - seria calculado com base em dados reais
        faltasComAviso: Math.round(totalFaltas * 0.3)
      });

    } catch (error) {
      console.error('Erro ao buscar histórico de aulas:', error);
      toast.error('Erro ao carregar histórico de aulas');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEstatisticasProfessores = useCallback(async (filtros: FiltrosProfessores) => {
    setLoading(true);
    try {
      let query = supabase
        .from('aulas')
        .select(`
          id,
          capacidade,
          nivel,
          professor_id,
          professor_nome,
          inscricoes!inscricoes_aula_id_fkey(
            id,
            status,
            presenca
          )
        `)
        .eq('ativa', true);

      if (filtros.nivel && filtros.nivel !== 'todos') {
        query = query.eq('nivel', filtros.nivel);
      }

      const { data: aulasData, error } = await query;

      if (error) throw error;

      // Agrupar por professor
      const professorStats = new Map();

      aulasData?.forEach(aula => {
        const professorId = aula.professor_id;
        const professorNome = aula.professor_nome;
        
        if (!professorStats.has(professorId)) {
          professorStats.set(professorId, {
            id: professorId,
            nome: professorNome,
            totalAulas: 0,
            totalVagas: 0,
            alunosAtendidos: 0,
            totalPresentes: 0,
            totalConfirmados: 0
          });
        }

        const stats = professorStats.get(professorId);
        const inscricoes = aula.inscricoes || [];
        const confirmados = inscricoes.filter(i => i.status === 'confirmado');
        const presentes = confirmados.filter(i => i.presenca === true);

        stats.totalAulas += 1;
        stats.totalVagas += aula.capacidade;
        stats.alunosAtendidos += confirmados.length;
        stats.totalPresentes += presentes.length;
        stats.totalConfirmados += confirmados.length;
      });

      // Converter para array e calcular métricas
      const estatisticas = Array.from(professorStats.values()).map(stats => ({
        ...stats,
        taxaOcupacao: stats.totalVagas > 0 ? Math.round((stats.alunosAtendidos / stats.totalVagas) * 100) : 0,
        mediaPresenca: stats.totalConfirmados > 0 ? Math.round((stats.totalPresentes / stats.totalConfirmados) * 100) : 0
      }));

      // Ordenar por total de aulas (mais ativo primeiro)
      const ranking = [...estatisticas].sort((a, b) => b.totalAulas - a.totalAulas);

      setEstatisticasProfessores(estatisticas);
      setRankingProfessores(ranking);

    } catch (error) {
      console.error('Erro ao buscar estatísticas dos professores:', error);
      toast.error('Erro ao carregar estatísticas dos professores');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    historicoAulas,
    estatisticasPresenca,
    estatisticasProfessores,
    rankingProfessores,
    loading,
    fetchHistoricoAulas,
    fetchEstatisticasProfessores
  };
};