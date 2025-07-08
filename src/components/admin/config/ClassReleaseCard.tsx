import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';

interface ClassReleaseCardProps {
  formData: {
    diaLiberacao: number;
    horarioLiberacao: string;
  };
  onInputChange: (field: string, value: string | number) => void;
}

const ClassReleaseCard = ({ formData, onInputChange }: ClassReleaseCardProps) => {
  const diasSemana = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terça-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sábado' }
  ];

  return (
    <Card className="border-black/20">
      <CardHeader>
        <CardTitle className="text-black flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Liberação das Aulas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="diaLiberacao" className="text-black">
              Dia da semana para liberação
            </Label>
            <Select
              value={formData.diaLiberacao.toString()}
              onValueChange={(value) => onInputChange('diaLiberacao', parseInt(value))}
            >
              <SelectTrigger className="border-black/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {diasSemana.map((dia) => (
                  <SelectItem key={dia.value} value={dia.value.toString()}>
                    {dia.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="horarioLiberacao" className="text-black">
              Horário de liberação
            </Label>
            <Input
              id="horarioLiberacao"
              type="time"
              value={formData.horarioLiberacao}
              onChange={(e) => onInputChange('horarioLiberacao', e.target.value)}
              className="border-black/30"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassReleaseCard;