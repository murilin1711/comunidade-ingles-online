import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Lock, RefreshCw } from 'lucide-react';

interface AulaParaFechar {
  id: string;
  dia_semana: number;
  horario: string;
  nivel: string;
  professor_nome: string;
  inscricoes_ativas: number;
}

interface ClassCloseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aulas: AulaParaFechar[];
  aulasExcluidas: string[];
  loading: boolean;
  onConfirm: () => void;
  onToggleExclusao: (aulaId: string) => void;
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

const ClassCloseModal = ({ 
  open, 
  onOpenChange, 
  aulas, 
  aulasExcluidas, 
  loading, 
  onConfirm, 
  onToggleExclusao 
}: ClassCloseModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-red-600" />
            Confirmar Fechamento de Inscrições
          </DialogTitle>
          <DialogDescription>
            As inscrições serão encerradas, mas as aulas permanecerão visíveis
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {aulas.length === 0 ? (
            <div className="text-center py-8 text-black/60">
              Não há aulas com inscrições para fechar no momento.
            </div>
          ) : (
            aulas.map(aula => (
              <div key={aula.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Checkbox 
                  checked={!aulasExcluidas.includes(aula.id)} 
                  onCheckedChange={() => onToggleExclusao(aula.id)} 
                />
                <div className="flex-1">
                  <div className="font-medium text-black">
                    {aula.nivel} - {diasSemana[aula.dia_semana]?.label}
                  </div>
                  <div className="text-sm text-black/60">
                    <span className="font-medium">Professor:</span> {aula.professor_nome} • 
                    <span className="font-medium ml-2">Horário:</span> {aula.horario} • 
                    <span className="font-medium ml-2">{aula.inscricoes_ativas}</span> inscrições ativas
                  </div>
                </div>
                <Badge 
                  variant={aulasExcluidas.includes(aula.id) ? "secondary" : "destructive"} 
                  className={aulasExcluidas.includes(aula.id) ? "" : "bg-red-500 text-white"}
                >
                  {aulasExcluidas.includes(aula.id) ? 'Manter Aberta' : 'Fechar'}
                </Badge>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={loading} 
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              'Confirmar Fechamento'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClassCloseModal;