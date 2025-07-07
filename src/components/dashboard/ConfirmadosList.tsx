
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from 'lucide-react';

interface Confirmado {
  id: string;
  aluno_id: string;
  timestamp_inscricao: string;
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

  return (
    <Card className="border-black/20">
      <CardHeader>
        <CardTitle className="text-black flex items-center justify-between">
          Alunos Confirmados
          <Badge className="bg-green-500 text-white">
            {confirmados.length}/{capacidade}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {confirmados.length === 0 ? (
          <p className="text-black/60 text-center py-4">
            Nenhum aluno confirmado ainda
          </p>
        ) : (
          <div className="space-y-3">
            {confirmados.map((confirmado) => (
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
      </CardContent>
    </Card>
  );
};

export default ConfirmadosList;
