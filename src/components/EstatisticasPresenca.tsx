
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';

interface EstatisticasPresencaProps {
  professorId: string;
}

interface Estatistica {
  total_aulas: number;
  total_presencas: number;
  total_faltas: number;
  taxa_presenca: number;
}

const EstatisticasPresenca = ({ professorId }: EstatisticasPresencaProps) => {
  const [estatisticas, setEstatisticas] = useState<Estatistica | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEstatisticas();
  }, [professorId]);

  const fetchEstatisticas = async () => {
    try {
      // Buscar todas as inscrições nas aulas do professor
      const { data: inscricoes, error } = await supabase
        .from('inscricoes')
        .select(`
          presenca,
          aula:aulas!inscricoes_aula_id_fkey(professor_id)
        `)
        .eq('aulas.professor_id', professorId)
        .eq('status', 'confirmado')
        .is('cancelamento', null);

      if (error) throw error;

      const totalAulas = inscricoes?.length || 0;
      const totalPresencas = inscricoes?.filter(i => i.presenca === true).length || 0;
      const totalFaltas = inscricoes?.filter(i => i.presenca === false).length || 0;
      const taxaPresenca = totalAulas > 0 ? (totalPresencas / totalAulas) * 100 : 0;

      setEstatisticas({
        total_aulas: totalAulas,
        total_presencas: totalPresencas,
        total_faltas: totalFaltas,
        taxa_presenca: taxaPresenca
      });
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
          <CardTitle className="text-black">Estatísticas de Presença</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-black/60">Carregando estatísticas...</p>
        </CardContent>
      </Card>
    );
  }

  if (!estatisticas) {
    return (
      <Card className="border-black/20">
        <CardHeader>
          <CardTitle className="text-black">Estatísticas de Presença</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-black/60">Nenhuma estatística disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-black/20">
      <CardHeader>
        <CardTitle className="text-black">Estatísticas de Presença</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-black">{estatisticas.total_aulas}</div>
            <div className="text-sm text-black/60">Total de Aulas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{estatisticas.total_presencas}</div>
            <div className="text-sm text-black/60">Presenças</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{estatisticas.total_faltas}</div>
            <div className="text-sm text-black/60">Faltas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{estatisticas.taxa_presenca.toFixed(1)}%</div>
            <div className="text-sm text-black/60">Taxa de Presença</div>
          </div>
        </div>
        <div className="mt-4">
          <Badge 
            className={
              estatisticas.taxa_presenca >= 80 ? "bg-green-500 text-white" :
              estatisticas.taxa_presenca >= 60 ? "bg-yellow-500 text-black" :
              "bg-red-500 text-white"
            }
          >
            {estatisticas.taxa_presenca >= 80 ? "Excelente" :
             estatisticas.taxa_presenca >= 60 ? "Bom" : "Precisa Melhorar"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default EstatisticasPresenca;
