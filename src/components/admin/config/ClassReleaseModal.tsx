import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarPlus, RefreshCw } from 'lucide-react';

interface AulaParaLiberar {
  id: string;
  dia_semana: number;
  horario: string;
  nivel: string;
  professor_nome: string;
  capacidade: number;
  data_aula: string | null;
  ativa: boolean;
  inscricoes_abertas: boolean;
}

interface ClassReleaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aulas: AulaParaLiberar[];
  loading: boolean;
  onConfirm: () => void;
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

const ClassReleaseModal = ({ open, onOpenChange, aulas, loading, onConfirm }: ClassReleaseModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-green-600" />
            Liberar Aulas Agora
          </DialogTitle>
          <DialogDescription>
            As inscrições serão abertas imediatamente
          </DialogDescription>
        </DialogHeader>

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
          <p className="text-blue-800 text-sm font-medium">
            Horário atual: {new Date().toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-3">
          {aulas.length === 0 ? (
            <div className="text-center py-8 text-black/60">
              Não há aulas para liberar no momento.
            </div>
          ) : (
            aulas.map(aula => (
              <div key={aula.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex-1">
                  <div className="font-semibold text-black text-lg">
                    {aula.nivel} - {diasSemana[aula.dia_semana]?.label}
                  </div>
                  <div className="text-sm text-black/60 mt-1">
                    <span className="font-medium">Professor:</span> {aula.professor_nome}
                  </div>
                  <div className="text-sm text-black/60">
                    <span className="font-medium">Horário:</span> {aula.horario} • 
                    <span className="font-medium ml-2">Capacidade:</span> {aula.capacidade} vagas
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    Bloqueada
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    → Liberar Agora
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={loading} className="bg-green-500 hover:bg-green-600 text-white">
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              'Liberar Agora'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClassReleaseModal;