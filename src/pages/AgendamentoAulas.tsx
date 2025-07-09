import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Plus, Trash2, Calendar } from 'lucide-react';

interface ConfiguracaoSistema {
  id: string;
  dia_liberacao: number;
  horario_liberacao: string;
  criado_em: string;
  atualizado_em: string;
}

const AgendamentoAulas = () => {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoSistema[]>([]);
  const [novaConfiguracao, setNovaConfiguracao] = useState({
    dia_liberacao: 1, // Segunda-feira
    horario_liberacao: '12:30'
  });
  const [loading, setLoading] = useState(false);
  const { user, logout, userData } = useAuth();

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
    if (!user || userData?.role !== 'admin') return;

    fetchConfiguracoes();

    // Real-time updates
    const channel = supabase
      .channel('configuracoes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'configuracoes_sistema'
        },
        () => {
          fetchConfiguracoes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userData]);

  const fetchConfiguracoes = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setConfiguracoes(data || []);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      toast.error('Erro ao carregar configurações');
    }
  };

  const handleAdicionarConfiguracao = async () => {
    if (!user || userData?.role !== 'admin') {
      toast.error('Acesso negado');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('configuracoes_sistema')
        .insert({
          dia_liberacao: novaConfiguracao.dia_liberacao,
          horario_liberacao: novaConfiguracao.horario_liberacao
        });

      if (error) throw error;

      setNovaConfiguracao({
        dia_liberacao: 1,
        horario_liberacao: '12:30'
      });

      toast.success('Configuração adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar configuração:', error);
      toast.error('Erro ao adicionar configuração');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoverConfiguracao = async (id: string) => {
    if (!user || userData?.role !== 'admin') {
      toast.error('Acesso negado');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('configuracoes_sistema')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Configuração removida!');
    } catch (error) {
      console.error('Erro ao remover configuração:', error);
      toast.error('Erro ao remover configuração');
    } finally {
      setLoading(false);
    }
  };

  const getDiaSemanaLabel = (dia: number) => {
    return diasSemana.find(d => d.value === dia)?.label || 'Desconhecido';
  };

  // Check if user is admin
  if (!userData || userData.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
            <p className="text-gray-600 mb-4">Esta página é restrita para administradores.</p>
            <Button onClick={logout}>Voltar ao Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Configurações do Sistema
          </h1>
          <Button onClick={logout} variant="outline">
            Sair
          </Button>
        </div>

        {/* Formulário para nova configuração */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nova Configuração de Liberação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="dia_liberacao">Dia da Liberação</Label>
                <Select 
                  value={novaConfiguracao.dia_liberacao.toString()} 
                  onValueChange={(value) => setNovaConfiguracao(prev => ({ ...prev, dia_liberacao: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o dia" />
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
                <Label htmlFor="horario_liberacao">Horário da Liberação</Label>
                <Input
                  id="horario_liberacao"
                  type="time"
                  value={novaConfiguracao.horario_liberacao}
                  onChange={(e) => setNovaConfiguracao(prev => ({ ...prev, horario_liberacao: e.target.value }))}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleAdicionarConfiguracao}
                  disabled={loading}
                  className="w-full"
                >
                  Adicionar Configuração
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de configurações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Configurações Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {configuracoes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhuma configuração cadastrada
              </p>
            ) : (
              <div className="space-y-3">
                {configuracoes.map((config) => (
                  <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">
                          Liberação: {getDiaSemanaLabel(config.dia_liberacao)} às {config.horario_liberacao}
                        </p>
                        <p className="text-sm text-gray-600">
                          Criado em: {format(new Date(config.criado_em), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant="default">
                        Ativa
                      </Badge>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoverConfiguracao(config.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações sobre funcionamento */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Como Funciona</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• As configurações definem quando as inscrições para aulas serão abertas automaticamente</p>
              <p>• O sistema verifica automaticamente nos horários configurados</p>
              <p>• Por padrão, as aulas são liberadas toda segunda-feira às 12:30</p>
              <p>• Você pode configurar múltiplos horários de liberação</p>
              <p>• As notificações serão enviadas aos alunos quando as inscrições forem abertas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgendamentoAulas;