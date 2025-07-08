
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle } from 'lucide-react';
import { useSecurity } from '@/hooks/useSecurity';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface AvisarFaltaModalProps {
  aulaId: string;
  alunoId: string;
  diaSemana: string;
  horario: string;
}

const AvisarFaltaModal = ({ aulaId, alunoId, diaSemana, horario }: AvisarFaltaModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [motivo, setMotivo] = useState('');
  const { canPerformCriticalAction } = useSecurity();
  const { handleError, handleSuccess } = useErrorHandler();

  const handleAvisarFalta = async () => {
    if (!motivo.trim()) {
      handleError(new Error('required_field'), 'Motivo da falta é obrigatório');
      return;
    }

    // Verificação de segurança obrigatória
    if (!canPerformCriticalAction()) {
      return;
    }

    setLoading(true);
    try {
      const agora = new Date();
      
      // Criar aviso de falta para o administrador avaliar
      const { error: avisoError } = await supabase
        .from('avisos_falta')
        .insert({
          aluno_id: alunoId,
          aula_id: aulaId,
          motivo: motivo.trim(),
          data_aviso: agora.toISOString(),
          status: 'pendente'
        });

      if (avisoError) throw avisoError;

      // Marcar a inscrição como cancelada com aviso de falta
      const { error: updateError } = await supabase
        .from('inscricoes')
        .update({
          cancelamento: agora.toISOString(),
          motivo_cancelamento: 'aviso_pendente',
          atualizado_em: agora.toISOString()
        })
        .eq('aula_id', aulaId)
        .eq('aluno_id', alunoId)
        .is('cancelamento', null);

      if (updateError) throw updateError;

      // Promover próximo da lista de espera
      const { error: promoverError } = await supabase.rpc('promover_lista_espera', {
        aula_uuid: aulaId
      });

      if (promoverError) {
        console.error('Erro ao promover lista de espera:', promoverError);
      }

      handleSuccess('Aviso de falta enviado! Sua suspensão está sendo calculada por um administrador.');
      
      setOpen(false);
      setMotivo('');
      
      // Recarregar a página para atualizar as listas
      window.location.reload();
    } catch (error: any) {
      handleError(error, 'Erro ao avisar falta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-orange-300 text-orange-700 hover:bg-orange-50">
          <AlertTriangle className="w-4 h-4 mr-1" />
          Avisar Falta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-black">Avisar Falta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-black/70">
            Você está prestes a avisar que faltará na aula de <strong>{diaSemana}</strong> às <strong>{horario}</strong>.
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="motivo" className="text-black font-medium">
              Motivo da falta *
            </Label>
            <Textarea
              id="motivo"
              placeholder="Descreva o motivo da sua falta..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              className="border-black/30 focus:border-yellow-500"
              disabled={loading}
            />
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Atenção:</strong> Sua inscrição será removida e a suspensão será calculada por um administrador baseada no motivo informado.
            </p>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setMotivo('');
              }}
              className="flex-1 border-black/30 text-black hover:bg-yellow-50"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAvisarFalta}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              disabled={loading || !motivo.trim()}
            >
              {loading ? 'Enviando...' : 'Enviar Aviso'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvisarFaltaModal;
