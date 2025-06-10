
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Aula {
  id: string;
  dia_semana: number;
  horario: string;
  link_meet: string;
  capacidade: number;
  ativa: boolean;
  professor_nome?: string;
}

interface AulaSelectorProps {
  aulas: Aula[];
  aulaSelecionada: string;
  onAulaChange: (aulaId: string) => void;
}

const AulaSelector = ({ aulas, aulaSelecionada, onAulaChange }: AulaSelectorProps) => {
  const diasSemana = [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
  ];

  return (
    <Card className="mb-6 border-black/20">
      <CardHeader>
        <CardTitle className="text-black">Selecionar Aula para Gerenciar Inscrições</CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={aulaSelecionada} onValueChange={onAulaChange}>
          <SelectTrigger className="w-full border-black/20 focus:border-yellow-500 focus:ring-yellow-500">
            <SelectValue placeholder="Selecione uma aula" />
          </SelectTrigger>
          <SelectContent>
            {aulas.map((aula) => (
              <SelectItem key={aula.id} value={aula.id}>
                {diasSemana[aula.dia_semana]} - {aula.horario}
                {aula.professor_nome && ` (${aula.professor_nome})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};

export default AulaSelector;
