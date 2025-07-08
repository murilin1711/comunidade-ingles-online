import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle } from 'lucide-react';

interface SuspensionRulesCardProps {
  formData: {
    faltaComAvisoMais4h: number;
    faltaComAvisoMenos4h: number;
    faltaSemAviso: number;
    horasMinimaBaixaCansulamento: number;
  };
  onInputChange: (field: string, value: string | number) => void;
}

const SuspensionRulesCard = ({ formData, onInputChange }: SuspensionRulesCardProps) => {
  return (
    <Card className="border-black/20">
      <CardHeader>
        <CardTitle className="text-black flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Regras de Suspensão
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="faltaComAvisoMais4h" className="text-black">
              Falta com aviso ≥ {formData.horasMinimaBaixaCansulamento}h antes
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="faltaComAvisoMais4h"
                type="number"
                min="1"
                max="12"
                value={formData.faltaComAvisoMais4h}
                onChange={(e) => onInputChange('faltaComAvisoMais4h', parseInt(e.target.value))}
                className="border-black/30"
              />
              <span className="text-black">semana(s)</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="faltaComAvisoMenos4h" className="text-black">
              Falta com aviso &lt; {formData.horasMinimaBaixaCansulamento}h antes
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="faltaComAvisoMenos4h"
                type="number"
                min="1"
                max="12"
                value={formData.faltaComAvisoMenos4h}
                onChange={(e) => onInputChange('faltaComAvisoMenos4h', parseInt(e.target.value))}
                className="border-black/30"
              />
              <span className="text-black">semana(s)</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="faltaSemAviso" className="text-black">
              Falta sem aviso
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="faltaSemAviso"
                type="number"
                min="1"
                max="12"
                value={formData.faltaSemAviso}
                onChange={(e) => onInputChange('faltaSemAviso', parseInt(e.target.value))}
                className="border-black/30"
              />
              <span className="text-black">semana(s)</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="horasMinimaBaixaCansulamento" className="text-black">
              Horas mínimas para cancelamento sem punição
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="horasMinimaBaixaCansulamento"
                type="number"
                min="1"
                max="48"
                value={formData.horasMinimaBaixaCansulamento}
                onChange={(e) => onInputChange('horasMinimaBaixaCansulamento', parseInt(e.target.value))}
                className="border-black/30"
              />
              <span className="text-black">hora(s)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SuspensionRulesCard;