import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';

interface DashboardMessagesCardProps {
  formData: {
    mensagemPeriodoInscricao: string;
    mensagemRegrasSuspensao: string;
  };
  onInputChange: (field: string, value: string | number) => void;
}

const DashboardMessagesCard = ({ formData, onInputChange }: DashboardMessagesCardProps) => {
  return (
    <Card className="border-black/20">
      <CardHeader>
        <CardTitle className="text-black flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Mensagens do Dashboard do Aluno
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="mensagemPeriodoInscricao" className="text-black">
            Mensagem sobre período de inscrições
          </Label>
          <Input
            id="mensagemPeriodoInscricao"
            value={formData.mensagemPeriodoInscricao}
            onChange={(e) => onInputChange('mensagemPeriodoInscricao', e.target.value)}
            className="border-black/30"
            placeholder="Mensagem sobre quando as inscrições abrem"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mensagemRegrasSuspensao" className="text-black">
            Mensagem sobre regras de suspensão
          </Label>
          <Input
            id="mensagemRegrasSuspensao"
            value={formData.mensagemRegrasSuspensao}
            onChange={(e) => onInputChange('mensagemRegrasSuspensao', e.target.value)}
            className="border-black/30"
            placeholder="Mensagem sobre as regras de suspensão"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardMessagesCard;