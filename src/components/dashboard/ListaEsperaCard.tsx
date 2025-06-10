
import React from 'react';
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

interface ListaEsperaCardProps {
  listaEspera: Inscricao[];
}

const ListaEsperaCard = ({ listaEspera }: ListaEsperaCardProps) => {
  return (
    <Card className="border-black/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-black">
          Lista de Espera
          <Badge variant="secondary" className="bg-black/10 text-black">{listaEspera.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {listaEspera.map((inscricao, index) => (
          <div key={inscricao.id} className="border border-black/20 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-black">{inscricao.aluno?.nome || 'Nome não encontrado'}</p>
                <p className="text-sm text-black/60">Posição: {index + 1}</p>
                <p className="text-xs text-black/40">
                  {new Date(inscricao.data_inscricao).toLocaleDateString('pt-BR')} às{' '}
                  {new Date(inscricao.data_inscricao).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
        {listaEspera.length === 0 && (
          <p className="text-black/60 text-center">Lista de espera vazia</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ListaEsperaCard;
