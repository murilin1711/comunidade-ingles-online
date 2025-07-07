
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface InscricaoDetalhada {
  id: string;
  aluno_id: string;
  status: 'confirmado' | 'espera';
  timestamp_inscricao: string;
  aluno: {
    nome: string;
  };
}

interface InscricoesDetalhesProps {
  aulaId: string;
  diaSemana: string;
  horario: string;
  minhaInscricao?: {
    id: string;
    status: 'confirmado' | 'espera';
  };
}

const InscricoesDetalhes = ({ aulaId, diaSemana, horario, minhaInscricao }: InscricoesDetalhesProps) => {
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [inscricoes, setInscricoes] = useState<InscricaoDetalhada[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchInscricoes = async () => {
    if (!mostrarDetalhes || !minhaInscricao) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inscricoes')
        .select(`
          id,
          aluno_id,
          status,
          timestamp_inscricao,
          aluno:alunos!inscricoes_aluno_id_fkey(nome)
        `)
        .eq('aula_id', aulaId)
        .is('cancelamento', null)
        .order('timestamp_inscricao', { ascending: true });

      if (error) throw error;

      setInscricoes(data || []);
    } catch (error) {
      console.error('Erro ao buscar detalhes das inscrições:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInscricoes();
  }, [mostrarDetalhes, aulaId, minhaInscricao]);

  if (!minhaInscricao) {
    return null;
  }

  const inscricoesConfirmadas = inscricoes.filter(i => i.status === 'confirmado');
  const inscricoesEspera = inscricoes.filter(i => i.status === 'espera');

  const formatarTimestamp = (timestamp: string) => {
    const data = new Date(timestamp);
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const isMinhaInscricao = (inscricao: InscricaoDetalhada) => {
    return inscricao.aluno_id === user?.id;
  };

  return (
    <div className="mt-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
        className="flex items-center gap-2 text-black/70 hover:text-black p-0 h-auto"
      >
        <Users className="w-4 h-4" />
        Ver ordem de inscrição
        {mostrarDetalhes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      {mostrarDetalhes && (
        <Card className="mt-2 border-black/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-black flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Ordem de Inscrição - {diaSemana} {horario}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <p className="text-black/60 text-sm">Carregando...</p>
            ) : (
              <div className="space-y-3">
                {/* Alunos Confirmados */}
                {inscricoesConfirmadas.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                      <Badge className="bg-green-500 text-white text-xs px-2 py-0">
                        Confirmados ({inscricoesConfirmadas.length})
                      </Badge>
                    </h4>
                    <div className="space-y-1">
                      {inscricoesConfirmadas.map((inscricao, index) => (
                        <div 
                          key={inscricao.id}
                          className={`flex items-center justify-between p-2 rounded text-sm ${
                            isMinhaInscricao(inscricao) 
                              ? 'bg-yellow-50 border border-yellow-200' 
                              : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs w-6 h-6 flex items-center justify-center">
                              {index + 1}
                            </Badge>
                            <span className={isMinhaInscricao(inscricao) ? 'font-medium' : ''}>
                              {isMinhaInscricao(inscricao) ? 'Você' : inscricao.aluno.nome}
                            </span>
                          </div>
                          <span className="text-xs text-black/60">
                            {formatarTimestamp(inscricao.timestamp_inscricao)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alunos em Lista de Espera */}
                {inscricoesEspera.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-orange-700 mb-2 flex items-center gap-1">
                      <Badge className="bg-orange-500 text-white text-xs px-2 py-0">
                        Lista de Espera ({inscricoesEspera.length})
                      </Badge>
                    </h4>
                    <div className="space-y-1">
                      {inscricoesEspera.map((inscricao, index) => (
                        <div 
                          key={inscricao.id}
                          className={`flex items-center justify-between p-2 rounded text-sm ${
                            isMinhaInscricao(inscricao) 
                              ? 'bg-yellow-50 border border-yellow-200' 
                              : 'bg-orange-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs w-6 h-6 flex items-center justify-center bg-orange-100">
                              {index + 1}
                            </Badge>
                            <span className={isMinhaInscricao(inscricao) ? 'font-medium' : ''}>
                              {isMinhaInscricao(inscricao) ? 'Você' : inscricao.aluno.nome}
                            </span>
                          </div>
                          <span className="text-xs text-black/60">
                            {formatarTimestamp(inscricao.timestamp_inscricao)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {inscricoes.length === 0 && (
                  <p className="text-black/60 text-sm text-center py-2">
                    Nenhuma inscrição encontrada
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InscricoesDetalhes;
