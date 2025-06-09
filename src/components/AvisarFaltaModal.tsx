
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle } from 'lucide-react';

interface AvisarFaltaModalProps {
  aulaId: string;
  alunoId: string;
  diaSemana: string;
  horario: string;
}

const AvisarFaltaModal = ({ aulaId, alunoId, diaSemana, horario }: AvisarFaltaModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAvisarFalta = async () => {
    setLoading(true);
    try {
      const agora = new Date();
      
      // Calcular se o aviso é com mais ou menos de 4 horas de antecedência
      // Para simplificar, vamos assumir que a aula é hoje
      const horasAntecedencia = 5; // Simulando mais de 4h para este exemplo
      
      const motivo = horasAntecedencia >= 4 ? 'aviso_4h' : 'aviso_menos_4h';
      
      // Marcar a inscrição como cancelada com aviso de falta
      const { error: updateError } = await supabase
        .from('inscricoes')
        .update({
          cancelamento: agora.toISOString(),
          motivo_cancelamento: motivo,
          atualizado_em: agora.toISOString()
        })
        .eq('aula_id', aulaId)
        .eq('aluno_id', alunoId)
        .is('cancelamento', null);

      if (updateError) throw updateError;

      // Aplicar suspensão se necessário
      if (motivo === 'aviso_menos_4h') {
        const { error: suspensaoError } = await supabase.rpc('aplicar_suspensao', {
          aluno_uuid: alunoId,
          motivo_param: motivo,
          semanas_param: 1
        });

        if (suspensaoError) throw suspensaoError;
      }

      // Promover próximo da lista de espera
      const { error: promoverError } = await supabase.rpc('promover_lista_espera', {
        aula_uuid: aulaId
      });

      if (promoverError) {
        console.error('Erro ao promover lista de espera:', promoverError);
      }

      toast.success(
        motivo === 'aviso_4h' 
          ? 'Falta avisada com sucesso!' 
          : 'Falta avisada. Você foi suspenso por 1 semana por avisar com menos de 4h de antecedência.'
      );
      
      setOpen(false);
    } catch (error) {
      console.error('Erro ao avisar falta:', error);
      toast.error('Erro ao avisar falta. Tente novamente.');
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Atenção:</strong> Avisos de falta com menos de 4 horas de antecedência resultam em suspensão de 1 semana.
            </p>
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border-black/30 text-black hover:bg-yellow-50"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAvisarFalta}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              disabled={loading}
            >
              {loading ? 'Processando...' : 'Confirmar Falta'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvisarFaltaModal;
