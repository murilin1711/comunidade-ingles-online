
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from 'lucide-react';

interface LiberarAulasSemanaModalProps {
  professorId: string;
  onAulasLiberadas: () => void;
}

const LiberarAulasSemanaModal = ({ professorId, onAulasLiberadas }: LiberarAulasSemanaModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLiberarAulas = async () => {
    setLoading(true);
    try {
      // Buscar templates de aulas do professor
      const { data: templates, error: templatesError } = await supabase
        .from('aulas')
        .select('*')
        .eq('professor_id', professorId)
        .eq('ativa', true);

      if (templatesError) throw templatesError;

      if (!templates || templates.length === 0) {
        toast.error('Nenhum template de aula encontrado. Crie ao menos uma aula primeiro.');
        return;
      }

      // Calcular data de início da próxima semana (segunda-feira)
      const hoje = new Date();
      const proximaSegunda = new Date(hoje);
      proximaSegunda.setDate(hoje.getDate() + (1 + 7 - hoje.getDay()) % 7 || 7);
      proximaSegunda.setHours(0, 0, 0, 0);

      let aulasLiberadas = 0;

      // Para cada template, verificar se já existe aula para a próxima semana
      for (const template of templates) {
        const dataAula = new Date(proximaSegunda);
        dataAula.setDate(proximaSegunda.getDate() + template.dia_semana - 1);

        // Verificar se já existe uma aula liberada para esta data
        const { data: aulaExistente, error: checkError } = await supabase
          .from('aulas_liberadas')
          .select('id')
          .eq('template_id', template.id)
          .eq('data_aula', dataAula.toISOString().split('T')[0])
          .maybeSingle();

        if (checkError) {
          console.error('Erro ao verificar aula existente:', checkError);
          continue;
        }

        if (!aulaExistente) {
          // Criar nova aula liberada
          const { error: insertError } = await supabase
            .from('aulas_liberadas')
            .insert({
              template_id: template.id,
              professor_id: professorId,
              data_aula: dataAula.toISOString().split('T')[0],
              horario: template.horario,
              link_meet: template.link_meet,
              capacidade: template.capacidade,
              dia_semana: template.dia_semana,
              liberada: true
            });

          if (insertError) {
            console.error('Erro ao liberar aula:', insertError);
          } else {
            aulasLiberadas++;
          }
        }
      }

      if (aulasLiberadas > 0) {
        toast.success(`${aulasLiberadas} aulas foram liberadas para a próxima semana!`);
      } else {
        toast.info('Todas as aulas já foram liberadas para a próxima semana.');
      }
      
      setOpen(false);
      onAulasLiberadas();
    } catch (error) {
      console.error('Erro ao liberar aulas:', error);
      toast.error('Erro ao liberar aulas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-500 hover:bg-green-600 text-white font-semibold">
          <Calendar className="w-4 h-4 mr-2" />
          Liberar Aulas da Semana
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-black">Liberar Aulas da Semana</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-black/70">
            Esta ação irá liberar todas as suas aulas ativas para a próxima semana.
          </p>
          <p className="text-black/70 text-sm">
            Após liberar, as aulas estarão disponíveis para inscrições dos alunos.
          </p>
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
              onClick={handleLiberarAulas}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold"
              disabled={loading}
            >
              {loading ? 'Liberando...' : 'Liberar Aulas'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LiberarAulasSemanaModal;
