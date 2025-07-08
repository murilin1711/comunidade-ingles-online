import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, Phone, Mail, Calendar, AlertTriangle } from 'lucide-react';

interface AvisoFalta {
  id: string;
  aluno_id: string;
  aula_id: string;
  data_aviso: string;
  status: string;
  motivo?: string;
  aluno: {
    nome: string;
    matricula: string;
    telefone: string;
    email: string;
  };
  aula: {
    dia_semana: number;
    horario: string;
    nivel: string;
    professor_nome: string;
    data_aula: string;
  };
}

interface AvisosFaltaCardProps {
  aviso: AvisoFalta;
  onAplicarSuspensao: (avisoId: string, tipoSuspensao: string) => void;
}

const AvisosFaltaCard = ({ aviso, onAplicarSuspensao }: AvisosFaltaCardProps) => {
  const [tipoSuspensao, setTipoSuspensao] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const diasSemana = [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
  ];

  const opcoesSuspensao = [
    { value: 'aviso_4h', label: 'Falta com aviso ≥4h (2 semanas)', semanas: 2 },
    { value: 'aviso_menos_4h', label: 'Falta com aviso <4h (3 semanas)', semanas: 3 },
    { value: 'falta_sem_aviso', label: 'Falta sem aviso (4 semanas)', semanas: 4 }
  ];

  const handleAplicarSuspensao = () => {
    if (!tipoSuspensao) return;
    setShowConfirmModal(true);
  };

  const confirmSuspensao = () => {
    onAplicarSuspensao(aviso.id, tipoSuspensao);
    setShowConfirmModal(false);
    setTipoSuspensao('');
  };

  const opcaoSelecionada = opcoesSuspensao.find(op => op.value === tipoSuspensao);

  return (
    <>
      <Card className="border-orange-200 bg-orange-50/50">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header com status */}
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Pendente de análise
              </Badge>
              <span className="text-xs text-black/60">
                {format(new Date(aviso.data_aviso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>

            {/* Dados do aluno */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-black/60" />
                <span className="font-medium text-black">{aviso.aluno.nome}</span>
                <span className="text-sm text-black/60">({aviso.aluno.matricula})</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3 text-black/60" />
                  <span className="text-black/80">{aviso.aluno.telefone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3 text-black/60" />
                  <span className="text-black/80">{aviso.aluno.email}</span>
                </div>
              </div>
            </div>

            {/* Motivo da falta */}
            {aviso.motivo && (
              <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Motivo da Falta</span>
                </div>
                <p className="text-blue-900 text-sm bg-white/70 p-2 rounded border">
                  {aviso.motivo}
                </p>
              </div>
            )}

            {/* Detalhes da aula */}
            <div className="bg-white/50 rounded-lg p-3 border border-black/10">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-black/60" />
                <span className="font-medium text-black">Detalhes da Aula</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-black/60">Dia:</span>
                  <span className="ml-1 text-black">{diasSemana[aviso.aula.dia_semana]}</span>
                </div>
                <div>
                  <span className="text-black/60">Horário:</span>
                  <span className="ml-1 text-black">{aviso.aula.horario}</span>
                </div>
                <div>
                  <span className="text-black/60">Nível:</span>
                  <span className="ml-1 text-black">{aviso.aula.nivel}</span>
                </div>
                <div>
                  <span className="text-black/60">Professor:</span>
                  <span className="ml-1 text-black">{aviso.aula.professor_nome}</span>
                </div>
              </div>
              {aviso.aula.data_aula && (
                <div className="mt-2 text-sm">
                  <span className="text-black/60">Data:</span>
                  <span className="ml-1 text-black">
                    {format(new Date(aviso.aula.data_aula), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              )}
            </div>

            {/* Controles de suspensão */}
            <div className="space-y-3">
              <Select value={tipoSuspensao} onValueChange={setTipoSuspensao}>
                <SelectTrigger className="border-black/30">
                  <SelectValue placeholder="Selecione o tipo de suspensão" />
                </SelectTrigger>
                <SelectContent>
                  {opcoesSuspensao.map((opcao) => (
                    <SelectItem key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handleAplicarSuspensao}
                disabled={!tipoSuspensao}
                className="w-full bg-red-500 hover:bg-red-600 text-white"
              >
                Aplicar Suspensão
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de confirmação */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Aplicação de Suspensão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja aplicar a suspensão para o aluno{' '}
              <strong>{aviso.aluno.nome}</strong>?
            </DialogDescription>
          </DialogHeader>
          
          {opcaoSelecionada && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-red-800 font-medium">
                Tipo: {opcaoSelecionada.label}
              </p>
              <p className="text-red-700">
                Duração: {opcaoSelecionada.semanas} semanas
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmSuspensao}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Confirmar Suspensão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AvisosFaltaCard;