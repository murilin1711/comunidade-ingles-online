import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Edit, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  inscricoes_abertas: boolean;
  capacidade: number;
}

interface Professor {
  user_id: string;
  nome: string;
  email: string;
}

interface EditarAulaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aula: Aula | null;
  onAulaEditada: () => void;
}

const diasSemana = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' }
];

const niveisDisponiveis = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper-Intermediate', 'Advanced', 'Lower'];

const EditarAulaModal = ({ open, onOpenChange, aula, onAulaEditada }: EditarAulaModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [professores, setProfessores] = useState<Professor[]>([]);
  
  // Estados do formulário
  const [professorId, setProfessorId] = useState('');
  const [diaSemana, setDiaSemana] = useState<number>(1);
  const [horario, setHorario] = useState('');
  const [linkMeet, setLinkMeet] = useState('');
  const [nivel, setNivel] = useState('');
  const [capacidade, setCapacidade] = useState(6);
  const [dataAula, setDataAula] = useState<Date | undefined>();
  const [ativa, setAtiva] = useState(true);
  const [inscricoesAbertas, setInscricoesAbertas] = useState(true);

  useEffect(() => {
    if (open) {
      fetchProfessores();
      if (aula) {
        // Preencher formulário com dados da aula
        setProfessorId(aula.professor_id);
        setDiaSemana(aula.dia_semana);
        setHorario(aula.horario);
        setLinkMeet(aula.link_meet);
        setNivel(aula.nivel);
        setCapacidade(aula.capacidade);
        setAtiva(aula.ativa);
        setInscricoesAbertas(aula.inscricoes_abertas);
        if (aula.data_aula) {
          setDataAula(new Date(aula.data_aula));
        } else {
          setDataAula(undefined);
        }
      }
    }
  }, [open, aula]);

  const fetchProfessores = async () => {
    try {
      const { data, error } = await supabase
        .from('professores')
        .select('user_id, nome, email')
        .order('nome');

      if (error) throw error;
      setProfessores(data || []);
    } catch (error) {
      console.error('Erro ao buscar professores:', error);
      toast.error('Erro ao carregar professores');
    }
  };

  const handleSalvar = async () => {
    if (!aula) return;

    try {
      setLoading(true);

      // Validações básicas
      if (!professorId || !horario || !linkMeet || !nivel) {
        toast.error('Por favor, preencha todos os campos obrigatórios.');
        return;
      }

      // Buscar nome do professor
      const professorSelecionado = professores.find(p => p.user_id === professorId);

      const updateData = {
        professor_id: professorId,
        professor_nome: professorSelecionado?.nome || null,
        dia_semana: diaSemana,
        horario,
        link_meet: linkMeet,
        nivel,
        capacidade,
        data_aula: dataAula ? dataAula.toISOString().split('T')[0] : null,
        ativa,
        inscricoes_abertas: inscricoesAbertas,
        status_alterado_por: user?.id,
        status_alterado_em: new Date().toISOString(),
        status_alterado_por_tipo: 'admin',
        atualizado_em: new Date().toISOString()
      };

      const { error } = await supabase
        .from('aulas')
        .update(updateData)
        .eq('id', aula.id);

      if (error) throw error;

      toast.success('Aula editada com sucesso!');
      onAulaEditada();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao editar aula:', error);
      toast.error(`Erro ao editar aula: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-black">
            <Edit className="w-5 h-5" />
            Editar Aula
          </DialogTitle>
          <DialogDescription>
            Edite as informações da aula. Campos obrigatórios marcados com *.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Professor */}
          <div className="space-y-2">
            <Label htmlFor="professor" className="text-black">Professor *</Label>
            <Select value={professorId} onValueChange={setProfessorId}>
              <SelectTrigger className="border-black/30">
                <SelectValue placeholder="Selecione um professor" />
              </SelectTrigger>
              <SelectContent>
                {professores.map((professor) => (
                  <SelectItem key={professor.user_id} value={professor.user_id}>
                    {professor.nome} ({professor.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Dia da Semana */}
            <div className="space-y-2">
              <Label htmlFor="dia" className="text-black">Dia da Semana *</Label>
              <Select value={diaSemana.toString()} onValueChange={(value) => setDiaSemana(parseInt(value))}>
                <SelectTrigger className="border-black/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {diasSemana.map((dia) => (
                    <SelectItem key={dia.value} value={dia.value.toString()}>
                      {dia.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Horário */}
            <div className="space-y-2">
              <Label htmlFor="horario" className="text-black">Horário *</Label>
              <Input
                id="horario"
                type="time"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                className="border-black/30"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Nível */}
            <div className="space-y-2">
              <Label htmlFor="nivel" className="text-black">Nível *</Label>
              <Select value={nivel} onValueChange={setNivel}>
                <SelectTrigger className="border-black/30">
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  {niveisDisponiveis.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Capacidade */}
            <div className="space-y-2">
              <Label htmlFor="capacidade" className="text-black">Capacidade</Label>
              <Input
                id="capacidade"
                type="number"
                min="1"
                max="20"
                value={capacidade}
                onChange={(e) => setCapacidade(parseInt(e.target.value) || 6)}
                className="border-black/30"
              />
            </div>
          </div>

          {/* Link do Meet */}
          <div className="space-y-2">
            <Label htmlFor="link" className="text-black">Link do Google Meet *</Label>
            <Input
              id="link"
              type="url"
              placeholder="https://meet.google.com/..."
              value={linkMeet}
              onChange={(e) => setLinkMeet(e.target.value)}
              className="border-black/30"
              required
            />
          </div>

          {/* Data da Aula */}
          <div className="space-y-2">
            <Label className="text-black">Data da Aula (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-black/30",
                    !dataAula && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataAula ? format(dataAula, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataAula}
                  onSelect={setDataAula}
                  initialFocus
                  className="pointer-events-auto"
                />
                {dataAula && (
                  <div className="p-3 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setDataAula(undefined)}
                      className="w-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remover Data
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Status e Configurações */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-black">Status e Configurações</h4>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Status Ativa */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-black font-medium">Aula Ativa</Label>
                  <p className="text-sm text-black/60">Define se a aula está ativa no sistema</p>
                </div>
                <Switch checked={ativa} onCheckedChange={setAtiva} />
              </div>

              {/* Status Inscrições */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-black font-medium">Inscrições Abertas</Label>
                  <p className="text-sm text-black/60">Define se alunos podem se inscrever</p>
                </div>
                <Switch checked={inscricoesAbertas} onCheckedChange={setInscricoesAbertas} />
              </div>
            </div>

            {/* Status Visual */}
            <div className="flex gap-2 pt-2">
              <Badge variant={ativa ? "default" : "secondary"} className={ativa ? "bg-green-500 text-white" : ""}>
                {ativa ? "Ativa" : "Inativa"}
              </Badge>
              <Badge variant={inscricoesAbertas ? "default" : "secondary"} className={inscricoesAbertas ? "bg-blue-500 text-white" : ""}>
                {inscricoesAbertas ? "Inscrições Abertas" : "Inscrições Fechadas"}
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={loading} className="bg-yellow-500 hover:bg-yellow-600 text-black">
            {loading ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-black"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditarAulaModal;