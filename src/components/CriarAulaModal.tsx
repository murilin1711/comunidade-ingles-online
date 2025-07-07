
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Plus } from 'lucide-react';

interface CriarAulaModalProps {
  professorId: string;
  onAulaCriada: () => void;
}

const CriarAulaModal = ({ professorId, onAulaCriada }: CriarAulaModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { userData } = useAuth();
  const [formData, setFormData] = useState({
    dia_semana: '',
    horario: '',
    link_meet: '',
    professor_nome: '',
    nivel: ''
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

  const niveis = [
    { value: 'Upper', label: 'Upper' },
    { value: 'Lower', label: 'Lower' }
  ];

  // Preencher automaticamente o nome do professor quando o modal abrir
  useEffect(() => {
    if (open && userData) {
      setFormData(prev => ({ ...prev, professor_nome: userData.nome }));
    }
  }, [open, userData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.dia_semana || !formData.horario || !formData.link_meet || !formData.professor_nome || !formData.nivel) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('aulas')
        .insert({
          professor_id: professorId,
          dia_semana: parseInt(formData.dia_semana),
          horario: formData.horario,
          link_meet: formData.link_meet,
          professor_nome: formData.professor_nome,
          nivel: formData.nivel,
          capacidade: 6,
          ativa: true
        });

      if (error) throw error;

      const diaSelecionado = diasSemana.find(d => d.value === formData.dia_semana)?.label;
      toast.success(`Aula criada com sucesso para ${diaSelecionado} às ${formData.horario} - Nível ${formData.nivel}`);
      
      setFormData({ dia_semana: '', horario: '', link_meet: '', professor_nome: userData?.nome || '', nivel: '' });
      setOpen(false);
      onAulaCriada();
    } catch (error) {
      console.error('Erro ao criar aula:', error);
      toast.error('Erro ao criar aula. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" />
          Criar Aula
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-black">Criar Nova Aula</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="professor_nome" className="text-black">Nome do Professor</Label>
            <Input
              id="professor_nome"
              type="text"
              value={formData.professor_nome}
              readOnly
              className="border-black/20 bg-gray-50 cursor-not-allowed"
              placeholder="Nome do professor"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nivel" className="text-black">Nível</Label>
            <Select 
              value={formData.nivel} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, nivel: value }))}
            >
              <SelectTrigger className="border-black/20 focus:border-yellow-500 focus:ring-yellow-500">
                <SelectValue placeholder="Selecione o nível" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-black/20">
                {niveis.map((nivel) => (
                  <SelectItem key={nivel.value} value={nivel.value} className="text-black hover:bg-yellow-50">
                    {nivel.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
              placeholder="Ex: 12:30"
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
              onClick={() => setOpen(false)}
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
              {loading ? 'Criando...' : 'Criar Aula'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CriarAulaModal;
