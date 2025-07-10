
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertTriangle } from 'lucide-react';

interface Confirmado {
  id: string;
  aluno_id: string;
  timestamp_inscricao: string;
  cancelamento?: string | null;
  motivo_cancelamento?: string | null;
  aluno?: {
    nome: string;
    matricula: string;
  } | null;
  presenca: boolean | null;
}

interface ConfirmadosListProps {
  confirmados: Confirmado[];
  capacidade: number;
  loading: boolean;
  onMarcarPresenca: (inscricaoId: string) => Promise<void>;
  onMarcarFalta: (inscricaoId: string) => Promise<void>;
}

const ConfirmadosList = ({ 
  confirmados, 
  capacidade, 
  loading, 
  onMarcarPresenca, 
  onMarcarFalta 
}: ConfirmadosListProps) => {
  
  const formatarTimestamp = (timestamp: string) => {
    const data = new Date(timestamp);
    const milissegundos = data.getMilliseconds().toString().padStart(3, '0');
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + `.${milissegundos}`;
  };

  // Separar confirmados ativos dos que avisaram falta
  const confirmadosAtivos = confirmados.filter(c => !c.cancelamento);
  const faltasComAviso = confirmados.filter(c => 
    c.cancelamento && c.motivo_cancelamento?.includes('Aviso de falta')
  );

  return (
    <Card className="border-black/20">
      <CardHeader>
        <CardTitle className="text-black flex items-center justify-between">
          Alunos Confirmados
          <Badge className="bg-green-500 text-white">
            {confirmadosAtivos.length}/{capacidade}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {confirmadosAtivos.length === 0 && faltasComAviso.length === 0 ? (
          <p className="text-black/60 text-center py-4">
            Nenhum aluno confirmado ainda
          </p>
        ) : (
          <div className="space-y-4">
            {/* Alunos confirmados ativos */}
            {confirmadosAtivos.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-green-700">
                  Alunos Ativos ({confirmadosAtivos.length})
                </h4>
                {confirmadosAtivos.map((confirmado) => (
                  <div 
                    key={confirmado.id} 
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-black/10"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-black">
                        {confirmado.aluno?.nome || 'Nome não disponível'}
                      </p>
                      <p className="text-sm text-black/60">
                        Matrícula: {confirmado.aluno?.matricula || 'N/A'}
                      </p>
                      <p className="text-xs text-black/50">
                        Inscrito em: {formatarTimestamp(confirmado.timestamp_inscricao)}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {confirmado.presenca === null ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => onMarcarPresenca(confirmado.id)}
                            disabled={loading}
                            className="bg-green-500 hover:bg-green-600 text-white"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onMarcarFalta(confirmado.id)}
                            disabled={loading}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Badge 
                          className={confirmado.presenca ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}
                        >
                          {confirmado.presenca ? 'Presente' : 'Falta'}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Faltas com aviso */}
            {faltasComAviso.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-orange-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Faltas Avisadas ({faltasComAviso.length})
                </h4>
                {faltasComAviso.map((falta) => (
                  <div 
                    key={falta.id} 
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-black">
                        {falta.aluno?.nome || 'Nome não disponível'}
                      </p>
                      <p className="text-sm text-black/60">
                        Matrícula: {falta.aluno?.matricula || 'N/A'}
                      </p>
                      <p className="text-xs text-orange-700">
                        Cancelado em: {falta.cancelamento ? formatarTimestamp(falta.cancelamento) : 'N/A'}
                      </p>
                    </div>
                    
                    <Badge className="bg-orange-500 text-white">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Falta Avisada
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConfirmadosList;
