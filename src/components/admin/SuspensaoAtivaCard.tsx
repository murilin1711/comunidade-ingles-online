import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock, User, Phone, AlertTriangle } from 'lucide-react';

interface SuspensaoAtiva {
  id: string;
  aluno_id: string;
  semanas: number;
  data_inicio: string;
  data_fim: string;
  ativa: boolean;
  motivo: string;
  aluno: {
    nome: string;
    matricula: string;
    telefone: string;
  };
}

interface SuspensaoAtivaCardProps {
  suspensao: SuspensaoAtiva;
  onCancelarSuspensao: (suspensaoId: string) => void;
  onEditarPeriodo: (suspensaoId: string, novaDataFim: Date) => void;
}

const SuspensaoAtivaCard = ({ suspensao, onCancelarSuspensao, onEditarPeriodo }: SuspensaoAtivaCardProps) => {
  const [tempoRestante, setTempoRestante] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [novaDataFim, setNovaDataFim] = useState<Date>();

  useEffect(() => {
    const calcularTempoRestante = () => {
      const agora = new Date();
      const dataFim = new Date(suspensao.data_fim);
      const diff = dataFim.getTime() - agora.getTime();

      if (diff <= 0) {
        setTempoRestante('Expirada');
        return;
      }

      const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (dias > 0) {
        setTempoRestante(`${dias}d ${horas}h ${minutos}m`);
      } else if (horas > 0) {
        setTempoRestante(`${horas}h ${minutos}m`);
      } else {
        setTempoRestante(`${minutos}m`);
      }
    };

    calcularTempoRestante();
    const interval = setInterval(calcularTempoRestante, 60000); // Atualiza a cada minuto

    return () => clearInterval(interval);
  }, [suspensao.data_fim]);

  const getMotivoLabel = (motivo: string) => {
    switch (motivo) {
      case 'aviso_4h':
        return 'Falta com aviso ≥4h';
      case 'aviso_menos_4h':
        return 'Falta com aviso <4h';
      case 'falta_sem_aviso':
        return 'Falta sem aviso';
      default:
        return motivo;
    }
  };

  const handleEditarPeriodo = () => {
    if (novaDataFim) {
      onEditarPeriodo(suspensao.id, novaDataFim);
      setShowEditModal(false);
      setNovaDataFim(undefined);
    }
  };

  return (
    <>
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header com status */}
            <div className="flex items-center justify-between">
              <Badge className="bg-red-500 text-white">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Suspenso
              </Badge>
              <span className="text-sm font-medium text-red-700">
                {tempoRestante}
              </span>
            </div>

            {/* Dados do aluno */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-black/60" />
                <span className="font-medium text-black">{suspensao.aluno.nome}</span>
                <span className="text-sm text-black/60">({suspensao.aluno.matricula})</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 text-black/60" />
                <span className="text-sm text-black/80">{suspensao.aluno.telefone}</span>
              </div>
            </div>

            {/* Detalhes da suspensão */}
            <div className="bg-white/50 rounded-lg p-3 border border-black/10">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-black/60">Motivo:</span>
                  <span className="ml-1 text-black font-medium">
                    {getMotivoLabel(suspensao.motivo)}
                  </span>
                </div>
                <div>
                  <span className="text-black/60">Início:</span>
                  <span className="ml-1 text-black">
                    {format(new Date(suspensao.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                <div>
                  <span className="text-black/60">Fim:</span>
                  <span className="ml-1 text-black">
                    {format(new Date(suspensao.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                <div>
                  <span className="text-black/60">Duração:</span>
                  <span className="ml-1 text-black">{suspensao.semanas} semana(s)</span>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              >
                Cancelar Suspensão
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditModal(true)}
                className="flex-1 border-black/30"
              >
                <CalendarIcon className="w-3 h-3 mr-1" />
                Editar Período
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de cancelamento */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Suspensão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar a suspensão do aluno{' '}
              <strong>{suspensao.aluno.nome}</strong>?
              <br />
              O aluno poderá voltar a se inscrever nas aulas imediatamente.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                onCancelarSuspensao(suspensao.id);
                setShowCancelModal(false);
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de edição de período */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Período de Suspensão</DialogTitle>
            <DialogDescription>
              Selecione a nova data de fim da suspensão para{' '}
              <strong>{suspensao.aluno.nome}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={novaDataFim}
              onSelect={setNovaDataFim}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </div>

          {novaDataFim && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-blue-800">
                Nova data de fim: {format(novaDataFim, "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setNovaDataFim(undefined);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEditarPeriodo}
              disabled={!novaDataFim}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Salvar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SuspensaoAtivaCard;