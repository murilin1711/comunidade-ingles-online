
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Inscricao {
  id: string;
  aula_id: string;
  aluno_id: string;
  status: 'confirmado' | 'espera';
  posicao_espera?: number;
  data_inscricao: string;
  presenca?: boolean;
  aluno?: {
    nome: string;
    matricula: string;
  };
}

interface ConfirmadosListProps {
  confirmados: Inscricao[];
  capacidade: number;
  loading: boolean;
  onMarcarPresenca: (inscricaoId: string) => void;
  onMarcarFalta: (alunoId: string, tipo: string) => void;
}

const ConfirmadosList = ({ 
  confirmados, 
  capacidade, 
  loading, 
  onMarcarPresenca, 
  onMarcarFalta 
}: ConfirmadosListProps) => {
  return (
    <Card className="border-black/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-black">
          Confirmados
          <Badge className="bg-yellow-500 text-black">{confirmados.length}/{capacidade}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {confirmados.map((inscricao) => (
          <div key={inscricao.id} className="border border-black/20 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium text-black">{inscricao.aluno?.nome || 'Nome não encontrado'}</p>
                <p className="text-sm text-black/60">Matrícula: {inscricao.aluno?.matricula}</p>
              </div>
              {inscricao.presenca && (
                <Badge className="bg-green-500 text-white">Presente</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {!inscricao.presenca && (
                <Button
                  size="sm"
                  onClick={() => onMarcarPresenca(inscricao.id)}
                  disabled={loading}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  Presença
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMarcarFalta(inscricao.aluno_id, 'cancel≥4h')}
                disabled={loading}
                className="border-black/30 text-black hover:bg-yellow-50"
              >
                Cancel ≥4h
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMarcarFalta(inscricao.aluno_id, 'cancel<4h')}
                disabled={loading}
                className="border-black/30 text-black hover:bg-yellow-50"
              >
                Cancel &lt;4h
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onMarcarFalta(inscricao.aluno_id, 'falta')}
                disabled={loading}
              >
                Falta sem aviso
              </Button>
            </div>
          </div>
        ))}
        {confirmados.length === 0 && (
          <p className="text-black/60 text-center">Nenhum aluno confirmado</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ConfirmadosList;
