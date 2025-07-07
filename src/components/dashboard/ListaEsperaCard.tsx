
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from 'lucide-react';

interface AlunoEspera {
  id: string;
  aluno_id: string;
  posicao_espera: number;
  timestamp_inscricao: string;
  aluno?: {
    nome: string;
    matricula: string;
  } | null;
}

interface ListaEsperaCardProps {
  listaEspera: AlunoEspera[];
}

const ListaEsperaCard = ({ listaEspera }: ListaEsperaCardProps) => {
  
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
        <CardTitle className="text-black flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Lista de Espera
          <Badge variant="secondary" className="bg-black/10 text-black">
            {listaEspera.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {listaEspera.length === 0 ? (
          <p className="text-black/60 text-center py-4">
            Nenhum aluno na lista de espera
          </p>
        ) : (
          <div className="space-y-3">
            {listaEspera
              .sort((a, b) => (a.posicao_espera || 0) - (b.posicao_espera || 0))
              .map((aluno, index) => (
                <div 
                  key={aluno.id} 
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                >
                  <div className="flex items-center gap-3">
                    <Badge className="bg-orange-500 text-white min-w-[24px] h-6 flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium text-black">
                        {aluno.aluno?.nome || 'Nome não disponível'}
                      </p>
                      <p className="text-sm text-black/60">
                        Matrícula: {aluno.aluno?.matricula || 'N/A'}
                      </p>
                      <p className="text-xs text-black/50">
                        Inscrito em: {formatarTimestamp(aluno.timestamp_inscricao)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ListaEsperaCard;
