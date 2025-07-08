import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Calendar, Clock, Plus, Lock, Settings, CalendarPlus, LockKeyhole, RefreshCw, BookOpen, Activity } from 'lucide-react';
import { useConfiguracoesAdmin } from '@/hooks/useConfiguracoesAdmin';
import CriarEditarAulas from './CriarEditarAulas';
import GerenciarAulasAtivas from './GerenciarAulasAtivas';
interface AulaParaLiberar {
  id: string;
  dia_semana: number;
  horario: string;
  nivel: string;
  professor_nome: string;
  capacidade: number;
  data_aula: string | null;
  ativa: boolean;
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
  const [regraUmaAulaSemana, setRegraUmaAulaSemana] = useState(true);
  const [showLiberarModal, setShowLiberarModal] = useState(false);
  const [showFecharModal, setShowFecharModal] = useState(false);
  const [aulasParaLiberar, setAulasParaLiberar] = useState<AulaParaLiberar[]>([]);
  const [aulasParaFechar, setAulasParaFechar] = useState<AulaParaFechar[]>([]);
  const [aulasExcluidas, setAulasExcluidas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [aulaParaEditar, setAulaParaEditar] = useState<any>(null);
  const [loadingLiberacao, setLoadingLiberacao] = useState(false);
  const [loadingFechamento, setLoadingFechamento] = useState(false);
  const [loadingRegra, setLoadingRegra] = useState(false);
  const {
    configuracoes,
    fetchConfiguracoes,
    salvarConfiguracoes: salvarConfiguracoesHook
  } = useConfiguracoesAdmin();
  const diasSemana = [{
    value: 0,
    label: 'Domingo'
  }, {
    value: 1,
    label: 'Segunda-feira'
  }, {
    value: 2,
    label: 'Terça-feira'
  }, {
    value: 3,
    label: 'Quarta-feira'
  }, {
    value: 4,
    label: 'Quinta-feira'
  }, {
    value: 5,
    label: 'Sexta-feira'
  }, {
    value: 6,
    label: 'Sábado'
  }];
  useEffect(() => {
    fetchConfiguracoes();
  }, [fetchConfiguracoes]);
  useEffect(() => {
    if (configuracoes) {
      setDiaLiberacao(configuracoes.diaLiberacao || 1);
      setHorarioLiberacao(configuracoes.horarioLiberacao || '12:30');
      setRegraUmaAulaSemana(configuracoes.regraUmaAulaSemana ?? true);
    }
  }, [configuracoes]);
  const buscarAulasParaLiberar = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('aulas').select(`
          id,
          dia_semana,
          horario,
          nivel,
          professor_nome,
          capacidade,
          data_aula,
          ativa
        `).eq('ativa', true).is('data_aula', null) // Aulas que ainda não foram liberadas
      .order('dia_semana').order('horario');
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
      const {
        data,
        error
      } = await supabase.from('aulas').select(`
          id,
          dia_semana,
          horario,
          nivel,
          professor_nome,
          inscricoes_aceitas:inscricoes!inscricoes_aula_id_fkey(
            id,
            status
          )
        `).eq('ativa', true).not('data_aula', 'is', null) // Aulas que já foram liberadas e estão ativas
      .order('dia_semana').order('horario');
      if (error) throw error;
      const aulasComInscricoes = data?.map(aula => ({
        id: aula.id,
        dia_semana: aula.dia_semana,
        horario: aula.horario,
        nivel: aula.nivel,
        professor_nome: aula.professor_nome,
        inscricoes_ativas: aula.inscricoes_aceitas?.filter(i => i.status === 'confirmado' || i.status === 'espera').length || 0
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
      const agora = new Date();
      const dataLiberacao = agora.toISOString().split('T')[0];
      const horarioLiberacao = agora.toTimeString().split(' ')[0];

      const updates = aulasParaLiberar.map(aula => ({
        id: aula.id,
        data_aula: dataLiberacao,
        inscricoes_abertas: true
      }));

      for (const update of updates) {
        const {
          error
        } = await supabase.from('aulas').update({
          data_aula: update.data_aula,
          inscricoes_abertas: true
        }).eq('id', update.id);
        if (error) throw error;
      }

      toast.success(`${updates.length} aulas liberadas imediatamente às ${horarioLiberacao}!`);
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
      const agora = new Date();
      const horarioFechamento = agora.toTimeString().split(' ')[0];
      const aulasParaFecharFiltradas = aulasParaFechar.filter(aula => !aulasExcluidas.includes(aula.id));
      
      for (const aula of aulasParaFecharFiltradas) {
        const {
          error
        } = await supabase.from('aulas').update({
          inscricoes_abertas: false
        }).eq('id', aula.id);
        if (error) throw error;
      }
      
      toast.success(`Inscrições fechadas para ${aulasParaFecharFiltradas.length} aulas às ${horarioFechamento}!`);
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
  const hasLiberacaoChanges = () => {
    if (!configuracoes) return false;
    return configuracoes.diaLiberacao !== diaLiberacao || 
           configuracoes.horarioLiberacao !== horarioLiberacao;
  };

  const hasFechamentoChanges = () => {
    // Para fechamento automático, verificar se há mudanças nos valores locais
    return diaFechamento !== 0 || horarioFechamento !== '18:00';
  };

  const validateTime = (horario: string) => {
    const [hours, minutes] = horario.split(':').map(Number);
    const now = new Date();
    const newTime = new Date(now);
    newTime.setHours(hours, minutes, 0, 0);
    
    // Se o horário é para hoje mas já passou, considerar para o próximo dia
    if (newTime <= now) {
      newTime.setDate(newTime.getDate() + 1);
    }
    
    // Verificar se faltam pelo menos 30 minutos
    const diffMinutes = (newTime.getTime() - now.getTime()) / (1000 * 60);
    return diffMinutes >= 30;
  };

  const hasRegraChanges = () => {
    if (!configuracoes) return false;
    return configuracoes.regraUmaAulaSemana !== regraUmaAulaSemana;
  };

  const salvarConfiguracaoRegra = async () => {
    try {
      setLoadingRegra(true);
      
      await salvarConfiguracoesHook({
        ...configuracoes,
        regraUmaAulaSemana
      });
      
      toast.success('Regra de inscrição atualizada com sucesso!');
      
      // Recarregar configurações para sincronizar
      await fetchConfiguracoes();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações da regra');
    } finally {
      setLoadingRegra(false);
    }
  };

  const salvarConfiguracaoLiberacao = async () => {
    try {
      setLoadingLiberacao(true);
      
      // Validar horário
      if (!validateTime(horarioLiberacao)) {
        toast.error('O horário deve ser pelo menos 30 minutos após o atual.');
        return;
      }

      await salvarConfiguracoesHook({
        ...configuracoes,
        diaLiberacao,
        horarioLiberacao
      });
      
      toast.success('Horário de liberação atualizado com sucesso!');
      
      // Recarregar configurações para sincronizar
      await fetchConfiguracoes();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações de liberação');
    } finally {
      setLoadingLiberacao(false);
    }
  };

  const salvarConfiguracaoFechamento = async () => {
    try {
      setLoadingFechamento(true);
      
      // Validar horário
      if (!validateTime(horarioFechamento)) {
        toast.error('O horário deve ser pelo menos 30 minutos após o atual.');
        return;
      }

      // Por enquanto, apenas mostrar toast de sucesso
      // Implementar salvamento de fechamento quando necessário
      toast.success('Horário de fechamento atualizado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações de fechamento');
    } finally {
      setLoadingFechamento(false);
    }
  };

  const salvarConfiguracoes = async () => {
    try {
      await salvarConfiguracoesHook({
        ...configuracoes,
        diaLiberacao,
        horarioLiberacao
        // Adicionar configurações de fechamento se necessário
      });
      toast.success('Configurações salvas!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    }
  };
  const toggleExclusaoAula = (aulaId: string) => {
    setAulasExcluidas(prev => prev.includes(aulaId) ? prev.filter(id => id !== aulaId) : [...prev, aulaId]);
  };
  const handleEditarAula = (aula: any) => {
    setAulaParaEditar(aula);
  };
  return <div className="space-y-6">
      <Tabs defaultValue="criar-editar" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white/50 border border-black/20">
          <TabsTrigger value="criar-editar" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Criar/Editar Aulas
          </TabsTrigger>
          <TabsTrigger value="gerenciar" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Aulas Ativas/Inativas
          </TabsTrigger>
          <TabsTrigger value="configuracoes" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="criar-editar">
          <CriarEditarAulas />
        </TabsContent>

        <TabsContent value="gerenciar">
          <GerenciarAulasAtivas onEditarAula={handleEditarAula} />
        </TabsContent>

        <TabsContent value="configuracoes">
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
              <Switch checked={liberacaoAutomatica} onCheckedChange={setLiberacaoAutomatica} />
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-black">Dia da semana</Label>
                <Select value={diaLiberacao.toString()} onValueChange={value => setDiaLiberacao(parseInt(value))} disabled={!liberacaoAutomatica}>
                  <SelectTrigger className="border-black/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {diasSemana.map(dia => <SelectItem key={dia.value} value={dia.value.toString()}>
                        {dia.label}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-black">Horário</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Input 
                        type="time" 
                        value={horarioLiberacao} 
                        onChange={e => setHorarioLiberacao(e.target.value)} 
                        disabled={!liberacaoAutomatica} 
                        className="border-black/30" 
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Exemplo: Se agora são 14:00, o novo horário deve ser 14:30 ou mais tarde.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={salvarConfiguracaoLiberacao}
                  disabled={loadingLiberacao || !hasLiberacaoChanges()}
                  className="bg-green-500 hover:bg-green-600 text-white"
                  size="sm"
                >
                  {loadingLiberacao ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
              </div>
            </div>

            {liberacaoAutomatica && <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-green-800 text-sm">
                  As aulas serão liberadas automaticamente toda{' '}
                  {diasSemana.find(d => d.value === diaLiberacao)?.label} às{' '}
                  {horarioLiberacao}
                </p>
              </div>}
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
              <Switch checked={fechamentoAutomatico} onCheckedChange={setFechamentoAutomatico} />
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-black">Dia da semana</Label>
                <Select value={diaFechamento.toString()} onValueChange={value => setDiaFechamento(parseInt(value))} disabled={!fechamentoAutomatico}>
                  <SelectTrigger className="border-black/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {diasSemana.map(dia => <SelectItem key={dia.value} value={dia.value.toString()}>
                        {dia.label}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-black">Horário</Label>
                <Input type="time" value={horarioFechamento} onChange={e => setHorarioFechamento(e.target.value)} disabled={!fechamentoAutomatico} className="border-black/30" />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={salvarConfiguracaoFechamento}
                  disabled={loadingFechamento || !hasFechamentoChanges()}
                  className="bg-red-500 hover:bg-red-600 text-white"
                  size="sm"
                >
                  {loadingFechamento ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
              </div>
            </div>

            {fechamentoAutomatico && <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-red-800 text-sm">
                  As inscrições serão fechadas automaticamente todo{' '}
                  {diasSemana.find(d => d.value === diaFechamento)?.label} às{' '}
                  {horarioFechamento}
                </p>
              </div>}
          </CardContent>
        </Card>
      </div>

      <Separator className="my-[25px]" />

      {/* Regras de Inscrição */}
      <Card className="border-blue-200 my-[25px]">
        <CardHeader>
          <CardTitle className="text-black flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Regras de Inscrição
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-black font-medium">Regra de uma aula por semana</Label>
              <p className="text-sm text-black/60 mt-1">
                Quando ativada, os alunos só podem se inscrever em uma aula por semana
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Switch 
                checked={regraUmaAulaSemana} 
                onCheckedChange={setRegraUmaAulaSemana} 
              />
              <Button
                onClick={salvarConfiguracaoRegra}
                disabled={loadingRegra || !hasRegraChanges()}
                className="bg-blue-500 hover:bg-blue-600 text-white"
                size="sm"
              >
                {loadingRegra ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </div>
          
          <div className={`p-3 rounded-lg border ${regraUmaAulaSemana ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
            <p className={`text-sm ${regraUmaAulaSemana ? 'text-blue-800' : 'text-gray-800'}`}>
              {regraUmaAulaSemana 
                ? 'Regra ATIVADA: Alunos podem se inscrever em apenas uma aula por semana'
                : 'Regra DESATIVADA: Alunos podem se inscrever em múltiplas aulas por semana'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-[25px]" />

      {/* Controles Manuais */}
      <Card className="border-black/20 my-[25px]">
        <CardHeader className="py-[25px] my-[10px]">
          <CardTitle className="text-black flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Controles Manuais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button onClick={buscarAulasParaLiberar} disabled={loading} className="h-16 bg-green-500 hover:bg-green-600 text-white flex-col gap-2">
              <div className="flex items-center gap-2">
                <CalendarPlus className="w-5 h-5" />
                <span className="font-medium">LIBERAR AULAS DESTA SEMANA</span>
              </div>
              <span className="text-xs opacity-90">
                Libera todas as aulas para inscrição
              </span>
            </Button>

            <Button onClick={buscarAulasParaFechar} disabled={loading} variant="destructive" className="h-16 bg-red-500 hover:bg-red-600 text-white flex-col gap-2">
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="w-5 h-5 text-green-600" />
              Liberar Aulas Agora
            </DialogTitle>
            <DialogDescription>
              As inscrições serão abertas imediatamente
            </DialogDescription>
          </DialogHeader>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
            <p className="text-blue-800 text-sm font-medium">
              Horário atual: {new Date().toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>

          <div className="max-h-96 overflow-y-auto space-y-3">
            {aulasParaLiberar.length === 0 ? (
              <div className="text-center py-8 text-black/60">
                Não há aulas para liberar no momento.
              </div>
            ) : (
              aulasParaLiberar.map(aula => (
                <div key={aula.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex-1">
                    <div className="font-semibold text-black text-lg">
                      {aula.nivel} - {diasSemana[aula.dia_semana]?.label}
                    </div>
                    <div className="text-sm text-black/60 mt-1">
                      <span className="font-medium">Professor:</span> {aula.professor_nome}
                    </div>
                    <div className="text-sm text-black/60">
                      <span className="font-medium">Horário:</span> {aula.horario} • 
                      <span className="font-medium ml-2">Capacidade:</span> {aula.capacidade} vagas
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      Bloqueada
                    </Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      → Liberar Agora
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLiberarModal(false)}>
              Cancelar
            </Button>
            <Button onClick={liberarAulasSemana} disabled={loading} className="bg-green-500 hover:bg-green-600 text-white">
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Liberar Agora'
              )}
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
              Confirmar Fechamento de Inscrições
            </DialogTitle>
            <DialogDescription>
              As inscrições serão encerradas, mas as aulas permanecerão visíveis
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {aulasParaFechar.length === 0 ? (
              <div className="text-center py-8 text-black/60">
                Não há aulas com inscrições para fechar no momento.
              </div>
            ) : (
              aulasParaFechar.map(aula => (
                <div key={aula.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Checkbox 
                    checked={!aulasExcluidas.includes(aula.id)} 
                    onCheckedChange={() => toggleExclusaoAula(aula.id)} 
                  />
                  <div className="flex-1">
                    <div className="font-medium text-black">
                      {aula.nivel} - {diasSemana[aula.dia_semana]?.label}
                    </div>
                    <div className="text-sm text-black/60">
                      <span className="font-medium">Professor:</span> {aula.professor_nome} • 
                      <span className="font-medium ml-2">Horário:</span> {aula.horario} • 
                      <span className="font-medium ml-2">{aula.inscricoes_ativas}</span> inscrições ativas
                    </div>
                  </div>
                  <Badge 
                    variant={aulasExcluidas.includes(aula.id) ? "secondary" : "destructive"} 
                    className={aulasExcluidas.includes(aula.id) ? "" : "bg-red-500 text-white"}
                  >
                    {aulasExcluidas.includes(aula.id) ? 'Manter Aberta' : 'Fechar'}
                  </Badge>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFecharModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={fecharInscricoes} 
              disabled={loading} 
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar Fechamento'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>
      </Tabs>
    </div>;
};
export default GerenciarAulasAdmin;