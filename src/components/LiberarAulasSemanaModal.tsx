
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

      toast.success(`${templates.length} aulas estão disponíveis para a semana!`);
      setOpen(false);
      onAulasLiberadas();
    } catch (error) {
      console.error('Erro ao verificar aulas:', error);
      toast.error('Erro ao verificar aulas disponíveis. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-500 hover:bg-green-600 text-white font-semibold">
          <Calendar className="w-4 h-4 mr-2" />
          Verificar Aulas da Semana
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-black">Verificar Aulas da Semana</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-black/70">
            Esta ação irá verificar todas as suas aulas ativas para a semana.
          </p>
          <p className="text-black/70 text-sm">
            As aulas já criadas estarão disponíveis para inscrições dos alunos.
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
              {loading ? 'Verificando...' : 'Verificar Aulas'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LiberarAulasSemanaModal;
