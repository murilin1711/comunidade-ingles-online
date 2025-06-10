
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';

interface EstatisticasPresencaAlunoProps {
  alunoId: string;
}

interface EstatisticasPeriodo {
  periodo: string;
  total_aulas: number;
  total_presencas: number;
  taxa_presenca: number;
}

const EstatisticasPresencaAluno = ({ alunoId }: EstatisticasPresencaAlunoProps) => {
  const [estatisticas, setEstatisticas] = useState<EstatisticasPeriodo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEstatisticas();
  }, [alunoId]);

  const fetchEstatisticas = async () => {
    try {
      const periodos = [
        { nome: 'Último mês', meses: 1 },
        { nome: '2 meses', meses: 2 },
        { nome: '4 meses', meses: 4 },
        { nome: '6 meses', meses: 6 },
        { nome: '1 ano', meses: 12 }
      ];

      const estatisticasPorPeriodo = await Promise.all(
        periodos.map(async (periodo) => {
          const dataInicio = new Date();
          dataInicio.setMonth(dataInicio.getMonth() - periodo.meses);

          // Buscar inscrições confirmadas do aluno no período
          const { data: inscricoes, error } = await supabase
            .from('inscricoes')
            .select('presenca, data_inscricao')
            .eq('aluno_id', alunoId)
            .eq('status', 'confirmado')
            .is('cancelamento', null)
            .gte('data_inscricao', dataInicio.toISOString())
            .not('presenca', 'is', null); // Só contar aulas onde presença foi marcada

          if (error) throw error;

          const totalAulas = inscricoes?.length || 0;
          const totalPresencas = inscricoes?.filter(i => i.presenca === true).length || 0;
          const taxaPresenca = totalAulas > 0 ? (totalPresencas / totalAulas) * 100 : 0;

          return {
            periodo: periodo.nome,
            total_aulas: totalAulas,
            total_presencas: totalPresencas,
            taxa_presenca: taxaPresenca
          };
        })
      );

      setEstatisticas(estatisticasPorPeriodo);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-black/20">
        <CardHeader>
          <CardTitle className="text-black">Minhas Estatísticas de Presença</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-black/60">Carregando estatísticas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-black/20">
      <CardHeader>
        <CardTitle className="text-black">Minhas Estatísticas de Presença</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {estatisticas.map((stat, index) => (
            <div key={index} className="border border-black/10 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-black">{stat.periodo}</h4>
                <Badge 
                  className={
                    stat.taxa_presenca >= 80 ? "bg-green-500 text-white" :
                    stat.taxa_presenca >= 60 ? "bg-yellow-500 text-black" :
                    "bg-red-500 text-white"
                  }
                >
                  {stat.taxa_presenca.toFixed(1)}%
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-black">{stat.total_aulas}</div>
                  <div className="text-black/60">Aulas</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-green-600">{stat.total_presencas}</div>
                  <div className="text-black/60">Presenças</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-red-600">{stat.total_aulas - stat.total_presencas}</div>
                  <div className="text-black/60">Faltas</div>
                </div>
              </div>
            </div>
          ))}
          
          {estatisticas.every(stat => stat.total_aulas === 0) && (
            <p className="text-black/60 text-center">Nenhuma estatística disponível ainda.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EstatisticasPresencaAluno;
