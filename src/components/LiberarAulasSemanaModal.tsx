
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

      // Calcular próxima segunda-feira
      const agora = new Date();
      const proximaSegunda = new Date(agora);
      proximaSegunda.setDate(agora.getDate() + (1 + 7 - agora.getDay()) % 7);
      proximaSegunda.setHours(0, 0, 0, 0);

      // Para cada template, criar aulas da semana
      const aulasParaCriar = [];
      
      for (const template of templates) {
        const dataAula = new Date(proximaSegunda);
        dataAula.setDate(proximaSegunda.getDate() + template.dia_semana - 1);
        
        aulasParaCriar.push({
          professor_id: professorId,
          professor_nome: template.professor_nome,
          dia_semana: template.dia_semana,
          horario: template.horario,
          link_meet: template.link_meet,
          capacidade: template.capacidade,
          data_aula: dataAula.toISOString().split('T')[0],
          liberada: true,
          ativa: true
        });
      }

      // Inserir todas as aulas
      const { error: insertError } = await supabase
        .from('aulas_semana')
        .insert(aulasParaCriar);

      if (insertError) throw insertError;

      toast.success(`${aulasParaCriar.length} aulas da semana liberadas com sucesso!`);
      setOpen(false);
      onAulasLiberadas();
    } catch (error) {
      console.error('Erro ao liberar aulas:', error);
      toast.error('Erro ao liberar aulas da semana. Tente novamente.');
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
            Esta ação irá criar todas as aulas da próxima semana baseadas nos seus templates de aula existentes.
          </p>
          <p className="text-black/70 text-sm">
            As aulas serão liberadas para a semana que começa na próxima segunda-feira.
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
