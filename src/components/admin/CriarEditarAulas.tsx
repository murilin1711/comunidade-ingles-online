
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Plus, CalendarIcon, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Professor {
  user_id: string;
  nome: string;
  email: string;
}

interface Aula {
  id: string;
  professor_id: string;
  professor_nome: string;
  dia_semana: number;
  horario: string;
  link_meet: string;
  nivel: string;
  data_aula: string | null;
  ativa: boolean;
  capacidade: number;
}

const CriarEditarAulas = () => {
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [aulaEditando, setAulaEditando] = useState<Aula | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    professor_id: '',
    dia_semana: '',
    horario: '',
    link_meet: '',
    nivel: '',
    capacidade: 6
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

  useEffect(() => {
    fetchProfessores();
  }, []);

  const fetchProfessores = async () => {
    try {
      console.log('CriarEditarAulas: Buscando professores...');
      const { data, error } = await supabase
        .from('professores')
        .select('user_id, nome, email')
        .order('nome');

      console.log('CriarEditarAulas: Dados dos professores:', data);
      if (error) {
        console.error('CriarEditarAulas: Erro ao buscar professores:', error);
        throw error;
      }
      
      console.log('CriarEditarAulas: Professores carregados:', data || []);
      setProfessores(data || []);
    } catch (error) {
      console.error('Erro ao buscar professores:', error);
      toast.error('Erro ao carregar professores');
    }
  };

  const resetForm = () => {
    setFormData({
      professor_id: '',
      dia_semana: '',
      horario: '',
      link_meet: '',
      nivel: '',
      capacidade: 6
    });
    setSelectedDate(undefined);
    setAulaEditando(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.professor_id || !formData.dia_semana || !formData.horario || 
        !formData.link_meet || !formData.nivel || !selectedDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const professorSelecionado = professores.find(p => p.user_id === formData.professor_id);
      
      const aulaData = {
        professor_id: formData.professor_id,
        professor_nome: professorSelecionado?.nome,
        dia_semana: parseInt(formData.dia_semana),
        horario: formData.horario,
        link_meet: formData.link_meet,
        nivel: formData.nivel,
        capacidade: formData.capacidade,
        data_aula: selectedDate.toISOString().split('T')[0],
        ativa: false // Inicia como inativa até ser agendada
      };

      if (aulaEditando) {
        // Atualizar aula existente
        const { error } = await supabase
          .from('aulas')
          .update(aulaData)
          .eq('id', aulaEditando.id);

        if (error) throw error;
        toast.success('Aula atualizada com sucesso!');
      } else {
        // Criar nova aula
        const { error } = await supabase
          .from('aulas')
          .insert(aulaData);

        if (error) throw error;
        toast.success('Aula criada com sucesso!');
      }

      resetForm();
    } catch (error) {
      console.error('Erro ao salvar aula:', error);
      toast.error('Erro ao salvar aula');
    } finally {
      setLoading(false);
    }
  };

  const editarAula = (aula: Aula) => {
    setAulaEditando(aula);
    setFormData({
      professor_id: aula.professor_id,
      dia_semana: aula.dia_semana.toString(),
      horario: aula.horario,
      link_meet: aula.link_meet,
      nivel: aula.nivel,
      capacidade: aula.capacidade
    });
    if (aula.data_aula) {
      setSelectedDate(new Date(aula.data_aula));
    }
  };

  return (
    <Card className="border-black/20">
      <CardHeader>
        <CardTitle className="text-black flex items-center gap-2">
          {aulaEditando ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {aulaEditando ? 'Editar Aula' : 'Criar Nova Aula'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="professor_id" className="text-black">Professor</Label>
              <Select 
                value={formData.professor_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, professor_id: value }))}
              >
                <SelectTrigger className="border-black/30">
                  <SelectValue placeholder="Selecione um professor" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {professores.length === 0 ? (
                    <SelectItem value="loading" disabled>Carregando professores...</SelectItem>
                  ) : (
                    professores.map((professor) => (
                      <SelectItem key={professor.user_id} value={professor.user_id}>
                        {professor.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nivel" className="text-black">Nível</Label>
              <Select 
                value={formData.nivel} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, nivel: value }))}
              >
                <SelectTrigger className="border-black/30">
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {niveis.map((nivel) => (
                    <SelectItem key={nivel.value} value={nivel.value}>
                      {nivel.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_aula" className="text-black">Data da Aula</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-black/30",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy") : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dia_semana" className="text-black">Dia da Semana</Label>
              <Select 
                value={formData.dia_semana} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, dia_semana: value }))}
              >
                <SelectTrigger className="border-black/30">
                  <SelectValue placeholder="Selecione o dia" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  {diasSemana.map((dia) => (
                    <SelectItem key={dia.value} value={dia.value}>
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
                className="border-black/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacidade" className="text-black">Capacidade</Label>
              <Input
                id="capacidade"
                type="number"
                min="1"
                max="20"
                value={formData.capacidade}
                onChange={(e) => setFormData(prev => ({ ...prev, capacidade: parseInt(e.target.value) || 6 }))}
                className="border-black/30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link_meet" className="text-black">Link do Google Meet</Label>
            <Input
              id="link_meet"
              type="url"
              value={formData.link_meet}
              onChange={(e) => setFormData(prev => ({ ...prev, link_meet: e.target.value }))}
              className="border-black/30"
              placeholder="https://meet.google.com/..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            {aulaEditando && (
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                className="border-black/30 text-black hover:bg-yellow-50"
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white"
              disabled={loading}
            >
              {loading ? 'Salvando...' : aulaEditando ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CriarEditarAulas;
