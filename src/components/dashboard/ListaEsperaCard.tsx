
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from 'lucide-react';

interface AlunoEspera {
  id: string;
  aluno_id: string;
  posicao_espera: number;
  aluno: {
    nome: string;
    matricula: string;
  };
}

interface ListaEsperaCardProps {
  listaEspera: AlunoEspera[];
}

const ListaEsperaCard = ({ listaEspera }: ListaEsperaCardProps) => {
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
                        {aluno.aluno.nome}
                      </p>
                      <p className="text-sm text-black/60">
                        Matrícula: {aluno.aluno.matricula}
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
