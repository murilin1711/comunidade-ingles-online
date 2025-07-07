import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { FiltrosProfessores, EstatisticasProfessor, Professor } from './types';

export const useProfessoresStats = () => {
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [estatisticasProfessores, setEstatisticasProfessores] = useState<EstatisticasProfessor[]>([]);
  const [rankingProfessores, setRankingProfessores] = useState<EstatisticasProfessor[]>([]);
  const [loading, setLoading] = useState(false);

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

  const fetchProfessores = useCallback(async () => {
    try {
      console.log('Buscando professores...');
      const { data, error } = await supabase
        .from('professores')
        .select('user_id, nome')
        .order('nome');

      console.log('Dados dos professores:', data);
      if (error) {
        console.error('Erro ao buscar professores:', error);
        throw error;
      }

      const professoresFormatados = data?.map(prof => ({
        id: prof.user_id,
        nome: prof.nome
      })) || [];

      console.log('Professores formatados:', professoresFormatados);
      setProfessores(professoresFormatados);
    } catch (error) {
      console.error('Erro ao buscar professores:', error);
      toast.error('Erro ao carregar lista de professores');
    }
  }, []);

  return {
    professores,
    estatisticasProfessores,
    rankingProfessores,
    loading,
    fetchEstatisticasProfessores,
    fetchProfessores
  };
};