
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface Aula {
  id: string;
  dia_semana: number;
  horario: string;
  link_meet: string;
  capacidade: number;
  ativa: boolean;
}

interface EditarAulaModalProps {
  aula: Aula | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAulaAtualizada: () => void;
}

const EditarAulaModal = ({ aula, open, onOpenChange, onAulaAtualizada }: EditarAulaModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dia_semana: '',
    horario: '',
    link_meet: ''
  });

  const diasSemana = [
    { value: '0', label: 'Domingo' },
    { value: '1', label: 'Segunda' },
    { value: '2', label: 'Terça' },
    { value: '3', label: 'Quarta' },
    { value: '4', label: 'Quinta' },
    { value: '5', label: 'Sexta' },
    { value: '6', label: 'Sábado' }
  ];

  React.useEffect(() => {
    if (aula && open) {
      setFormData({
        dia_semana: aula.dia_semana.toString(),
        horario: aula.horario,
        link_meet: aula.link_meet
      });
    }
  }, [aula, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!aula || !formData.dia_semana || !formData.horario || !formData.link_meet) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('aulas')
        .update({
          dia_semana: parseInt(formData.dia_semana),
          horario: formData.horario,
          link_meet: formData.link_meet,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', aula.id);

      if (error) throw error;

      const diaSelecionado = diasSemana.find(d => d.value === formData.dia_semana)?.label;
      toast.success(`Aula atualizada com sucesso para ${diaSelecionado} às ${formData.horario}`);
      
      onOpenChange(false);
      onAulaAtualizada();
    } catch (error) {
      console.error('Erro ao atualizar aula:', error);
      toast.error('Erro ao atualizar aula. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!aula) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-black">Editar Aula</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dia_semana" className="text-black">Dia da Semana</Label>
            <Select 
              value={formData.dia_semana} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, dia_semana: value }))}
            >
              <SelectTrigger className="border-black/20 focus:border-yellow-500 focus:ring-yellow-500">
                <SelectValue placeholder="Selecione o dia da semana" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-black/20">
                {diasSemana.map((dia) => (
                  <SelectItem key={dia.value} value={dia.value} className="text-black hover:bg-yellow-50">
                    {dia.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="horario" className="text-black">Horário</Label>
            <Input
              id="horario"
              type="time"
              value={formData.horario}
              onChange={(e) => setFormData(prev => ({ ...prev, horario: e.target.value }))}
              className="border-black/20 focus:border-yellow-500 focus:ring-yellow-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link_meet" className="text-black">Link do Google Meet</Label>
            <Input
              id="link_meet"
              type="url"
              value={formData.link_meet}
              onChange={(e) => setFormData(prev => ({ ...prev, link_meet: e.target.value }))}
              className="border-black/20 focus:border-yellow-500 focus:ring-yellow-500"
              placeholder="https://meet.google.com/..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-black/30 text-black hover:bg-yellow-50"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              disabled={loading}
            >
              {loading ? 'Atualizando...' : 'Atualizar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditarAulaModal;
