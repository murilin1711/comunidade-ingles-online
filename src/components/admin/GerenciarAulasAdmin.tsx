import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Lock, 
  Settings, 
  CalendarPlus,
  LockKeyhole,
  RefreshCw
} from 'lucide-react';
import { useConfiguracoesAdmin } from '@/hooks/useConfiguracoesAdmin';

interface AulaParaLiberar {
  id: string;
  dia_semana: number;
  horario: string;
  nivel: string;
  professor_nome: string;
  capacidade: number;
}

interface AulaParaFechar {
  id: string;
  dia_semana: number;
  horario: string;
  nivel: string;
  professor_nome: string;
  inscricoes_ativas: number;
}

const GerenciarAulasAdmin = () => {
  const [liberacaoAutomatica, setLiberacaoAutomatica] = useState(true);
  const [fechamentoAutomatico, setFechamentoAutomatico] = useState(true);
  const [diaLiberacao, setDiaLiberacao] = useState(1);
  const [horarioLiberacao, setHorarioLiberacao] = useState('12:30');
  const [diaFechamento, setDiaFechamento] = useState(0);
  const [horarioFechamento, setHorarioFechamento] = useState('18:00');
  
  const [showLiberarModal, setShowLiberarModal] = useState(false);
  const [showFecharModal, setShowFecharModal] = useState(false);
  const [aulasParaLiberar, setAulasParaLiberar] = useState<AulaParaLiberar[]>([]);
  const [aulasParaFechar, setAulasParaFechar] = useState<AulaParaFechar[]>([]);
  const [aulasExcluidas, setAulasExcluidas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const { configuracoes, fetchConfiguracoes, salvarConfiguracoes: salvarConfiguracoesHook } = useConfiguracoesAdmin();

  const diasSemana = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terça-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sábado' }
  ];

  useEffect(() => {
    fetchConfiguracoes();
  }, [fetchConfiguracoes]);

  useEffect(() => {
    if (configuracoes) {
      setDiaLiberacao(configuracoes.diaLiberacao || 1);
      setHorarioLiberacao(configuracoes.horarioLiberacao || '12:30');
    }
  }, [configuracoes]);

  const buscarAulasParaLiberar = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('aulas')
        .select(`
          id,
          dia_semana,
          horario,
          nivel,
          professor_nome,
          capacidade
        `)
        .eq('ativa', true)
        .is('data_aula', null) // Aulas que ainda não foram liberadas
        .order('dia_semana')
        .order('horario');

      if (error) throw error;
      setAulasParaLiberar(data || []);
      setShowLiberarModal(true);
    } catch (error) {
      console.error('Erro ao buscar aulas:', error);
      toast.error('Erro ao carregar aulas');
    } finally {
      setLoading(false);
    }
  };

  const buscarAulasParaFechar = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('aulas')
        .select(`
          id,
          dia_semana,
          horario,
          nivel,
          professor_nome,
          inscricoes!inscricoes_aula_id_fkey(
            id,
            status
          )
        `)
        .eq('ativa', true)
        .not('data_aula', 'is', null) // Aulas que já foram liberadas
        .order('dia_semana')
        .order('horario');

      if (error) throw error;

      const aulasComInscricoes = data?.map(aula => ({
        id: aula.id,
        dia_semana: aula.dia_semana,
        horario: aula.horario,
        nivel: aula.nivel,
        professor_nome: aula.professor_nome,
        inscricoes_ativas: aula.inscricoes?.filter(i => 
          i.status === 'confirmado' || i.status === 'espera'
        ).length || 0
      })) || [];

      setAulasParaFechar(aulasComInscricoes);
      setShowFecharModal(true);
    } catch (error) {
      console.error('Erro ao buscar aulas:', error);
      toast.error('Erro ao carregar aulas');
    } finally {
      setLoading(false);
    }
  };

  const liberarAulasSemana = async () => {
    try {
      setLoading(true);
      const dataLiberacao = new Date();
      const proximaSegunda = new Date(dataLiberacao);
      proximaSegunda.setDate(dataLiberacao.getDate() + (1 + 7 - dataLiberacao.getDay()) % 7);

      const updates = aulasParaLiberar.map(aula => ({
        id: aula.id,
        data_aula: proximaSegunda.toISOString().split('T')[0]
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('aulas')
          .update({ data_aula: update.data_aula })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast.success(`${updates.length} aulas liberadas para a semana!`);
      setShowLiberarModal(false);
      setAulasParaLiberar([]);
    } catch (error) {
      console.error('Erro ao liberar aulas:', error);
      toast.error('Erro ao liberar aulas');
    } finally {
      setLoading(false);
    }
  };

  const fecharInscricoes = async () => {
    try {
      setLoading(true);
      const aulasParaFecharFiltradas = aulasParaFechar.filter(
        aula => !aulasExcluidas.includes(aula.id)
      );

      for (const aula of aulasParaFecharFiltradas) {
        const { error } = await supabase
          .from('aulas')
          .update({ ativa: false })
          .eq('id', aula.id);

        if (error) throw error;
      }

      toast.success(`Inscrições fechadas para ${aulasParaFecharFiltradas.length} aulas!`);
      setShowFecharModal(false);
      setAulasParaFechar([]);
      setAulasExcluidas([]);
    } catch (error) {
      console.error('Erro ao fechar inscrições:', error);
      toast.error('Erro ao fechar inscrições');
    } finally {
      setLoading(false);
    }
  };

  const salvarConfiguracoes = async () => {
    try {
      await salvarConfiguracoesHook({
        ...configuracoes,
        diaLiberacao,
        horarioLiberacao,
        // Adicionar configurações de fechamento se necessário
      });
      toast.success('Configurações salvas!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  const toggleExclusaoAula = (aulaId: string) => {
    setAulasExcluidas(prev => 
      prev.includes(aulaId)
        ? prev.filter(id => id !== aulaId)
        : [...prev, aulaId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Configurações Automáticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Liberação Automática */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-black flex items-center gap-2">
              <CalendarPlus className="w-5 h-5 text-green-600" />
              Liberação Automática
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-black">Ativar liberação automática</Label>
              <Switch
                checked={liberacaoAutomatica}
                onCheckedChange={setLiberacaoAutomatica}
              />
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-black">Dia da semana</Label>
                <Select
                  value={diaLiberacao.toString()}
                  onValueChange={(value) => setDiaLiberacao(parseInt(value))}
                  disabled={!liberacaoAutomatica}
                >
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

              <div>
                <Label className="text-black">Horário</Label>
                <Input
                  type="time"
                  value={horarioLiberacao}
                  onChange={(e) => setHorarioLiberacao(e.target.value)}
                  disabled={!liberacaoAutomatica}
                  className="border-black/30"
                />
              </div>
            </div>

            {liberacaoAutomatica && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-green-800 text-sm">
                  As aulas serão liberadas automaticamente toda{' '}
                  {diasSemana.find(d => d.value === diaLiberacao)?.label} às{' '}
                  {horarioLiberacao}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fechamento Automático */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-black flex items-center gap-2">
              <LockKeyhole className="w-5 h-5 text-red-600" />
              Fechamento Automático
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-black">Ativar fechamento automático</Label>
              <Switch
                checked={fechamentoAutomatico}
                onCheckedChange={setFechamentoAutomatico}
              />
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-black">Dia da semana</Label>
                <Select
                  value={diaFechamento.toString()}
                  onValueChange={(value) => setDiaFechamento(parseInt(value))}
                  disabled={!fechamentoAutomatico}
                >
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

              <div>
                <Label className="text-black">Horário</Label>
                <Input
                  type="time"
                  value={horarioFechamento}
                  onChange={(e) => setHorarioFechamento(e.target.value)}
                  disabled={!fechamentoAutomatico}
                  className="border-black/30"
                />
              </div>
            </div>

            {fechamentoAutomatico && (
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-red-800 text-sm">
                  As inscrições serão fechadas automaticamente todo{' '}
                  {diasSemana.find(d => d.value === diaFechamento)?.label} às{' '}
                  {horarioFechamento}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Controles Manuais */}
      <Card className="border-black/20">
        <CardHeader>
          <CardTitle className="text-black flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Controles Manuais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={buscarAulasParaLiberar}
              disabled={loading}
              className="h-16 bg-green-500 hover:bg-green-600 text-white flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <CalendarPlus className="w-5 h-5" />
                <span className="font-medium">LIBERAR AULAS DESTA SEMANA</span>
              </div>
              <span className="text-xs opacity-90">
                Libera todas as aulas para inscrição
              </span>
            </Button>

            <Button
              onClick={buscarAulasParaFechar}
              disabled={loading}
              variant="destructive"
              className="h-16 bg-red-500 hover:bg-red-600 text-white flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                <span className="font-medium">FECHAR INSCRIÇÕES</span>
              </div>
              <span className="text-xs opacity-90">
                Fecha inscrições das aulas ativas
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal Liberar Aulas */}
      <Dialog open={showLiberarModal} onOpenChange={setShowLiberarModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="w-5 h-5 text-green-600" />
              Liberar Aulas desta Semana
            </DialogTitle>
            <DialogDescription>
              As seguintes aulas serão liberadas para inscrição:
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {aulasParaLiberar.map((aula) => (
              <div key={aula.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-black">
                    {diasSemana[aula.dia_semana]?.label} - {aula.horario}
                  </div>
                  <div className="text-sm text-black/60">
                    {aula.nivel} • {aula.professor_nome} • {aula.capacidade} vagas
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Liberar
                </Badge>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLiberarModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={liberarAulasSemana}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar Liberação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Fechar Inscrições */}
      <Dialog open={showFecharModal} onOpenChange={setShowFecharModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-600" />
              Fechar Inscrições
            </DialogTitle>
            <DialogDescription>
              Selecione as aulas que terão suas inscrições fechadas:
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {aulasParaFechar.map((aula) => (
              <div key={aula.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Checkbox
                  checked={!aulasExcluidas.includes(aula.id)}
                  onCheckedChange={() => toggleExclusaoAula(aula.id)}
                />
                <div className="flex-1">
                  <div className="font-medium text-black">
                    {diasSemana[aula.dia_semana]?.label} - {aula.horario}
                  </div>
                  <div className="text-sm text-black/60">
                    {aula.nivel} • {aula.professor_nome} • {aula.inscricoes_ativas} inscrições
                  </div>
                </div>
                <Badge 
                  variant={aulasExcluidas.includes(aula.id) ? "secondary" : "destructive"}
                  className={aulasExcluidas.includes(aula.id) ? "" : "bg-red-500 text-white"}
                >
                  {aulasExcluidas.includes(aula.id) ? 'Manter' : 'Fechar'}
                </Badge>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFecharModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={fecharInscricoes}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {loading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar Fechamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GerenciarAulasAdmin;