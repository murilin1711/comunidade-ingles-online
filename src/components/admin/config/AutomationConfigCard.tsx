import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CalendarPlus, LockKeyhole, RefreshCw } from 'lucide-react';

interface AutomationConfigCardProps {
  type: 'liberacao' | 'fechamento';
  title: string;
  icon: React.ReactNode;
  activated: boolean;
  onActivationChange: (activated: boolean) => void;
  diaValue: number;
  onDiaChange: (dia: number) => void;
  horarioValue: string;
  onHorarioChange: (horario: string) => void;
  loading: boolean;
  hasChanges: boolean;
  onSave: () => void;
  children?: React.ReactNode;
}

const diasSemana = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' }
];

const AutomationConfigCard = ({
  type,
  title,
  icon,
  activated,
  onActivationChange,
  diaValue,
  onDiaChange,
  horarioValue,
  onHorarioChange,
  loading,
  hasChanges,
  onSave,
  children
}: AutomationConfigCardProps) => {
  const cardBorderClass = type === 'liberacao' ? 'border-green-200' : 'border-red-200';
  const buttonClass = type === 'liberacao' 
    ? 'bg-green-500 hover:bg-green-600 text-white'
    : 'bg-red-500 hover:bg-red-600 text-white';

  return (
    <Card className={cardBorderClass}>
      <CardHeader>
        <CardTitle className="text-black flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-black">Ativar {title.toLowerCase()}</Label>
          <Switch checked={activated} onCheckedChange={onActivationChange} />
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-black">Dia da semana</Label>
            <Select value={diaValue.toString()} onValueChange={value => onDiaChange(parseInt(value))} disabled={!activated}>
              <SelectTrigger className="border-black/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {diasSemana.map(dia => (
                  <SelectItem key={dia.value} value={dia.value.toString()}>
                    {dia.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-black">Horário</Label>
            {type === 'liberacao' ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Input 
                      type="time" 
                      value={horarioValue} 
                      onChange={e => onHorarioChange(e.target.value)} 
                      disabled={!activated} 
                      className="border-black/30" 
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Exemplo: Se agora são 14:00, o novo horário deve ser 14:30 ou mais tarde.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Input 
                type="time" 
                value={horarioValue} 
                onChange={e => onHorarioChange(e.target.value)} 
                disabled={!activated} 
                className="border-black/30" 
              />
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={onSave}
              disabled={loading || !hasChanges}
              className={buttonClass}
              size="sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </div>

        {children}
      </CardContent>
    </Card>
  );
};

export default AutomationConfigCard;