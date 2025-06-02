
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Plus, Trash2, Calendar } from 'lucide-react';

interface AgendamentoConfig {
  id: string;
  diaSemana: number; // 0 = Domingo, 1 = Segunda, etc.
  horario: string;
  ativo: boolean;
  criadoEm: any;
}

const AgendamentoAulas = () => {
  const [agendamentos, setAgendamentos] = useState<AgendamentoConfig[]>([]);
  const [novoAgendamento, setNovoAgendamento] = useState({
    diaSemana: 1, // Segunda-feira
    horario: '12:30'
  });
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();

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
    if (!user) return;

    // Escutar agendamentos em tempo real
    const q = query(collection(db, 'agendamentos'), orderBy('criadoEm', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const agendamentosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AgendamentoConfig));
      setAgendamentos(agendamentosData);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    // Criar agendamento padrão se não existir
    const criarAgendamentoPadrao = async () => {
      if (agendamentos.length === 0 && user) {
        try {
          await addDoc(collection(db, 'agendamentos'), {
            diaSemana: 1, // Segunda-feira
            horario: '12:30',
            ativo: true,
            criadoEm: new Date()
          });
          toast.success('Agendamento padrão criado: Segunda-feira às 12:30');
        } catch (error) {
          console.error('Erro ao criar agendamento padrão:', error);
        }
      }
    };

    criarAgendamentoPadrao();
  }, [agendamentos, user]);

  const handleAdicionarAgendamento = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'agendamentos'), {
        diaSemana: novoAgendamento.diaSemana,
        horario: novoAgendamento.horario,
        ativo: true,
        criadoEm: new Date()
      });

      setNovoAgendamento({
        diaSemana: 1,
        horario: '12:30'
      });

      toast.success('Agendamento adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar agendamento:', error);
      toast.error('Erro ao adicionar agendamento');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoverAgendamento = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'agendamentos', id));
      toast.success('Agendamento removido!');
    } catch (error) {
      console.error('Erro ao remover agendamento:', error);
      toast.error('Erro ao remover agendamento');
    } finally {
      setLoading(false);
    }
  };

  const getDiaSemanaLabel = (dia: number) => {
    return diasSemana.find(d => d.value === dia)?.label || 'Desconhecido';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Agendamento de Aulas
          </h1>
          <Button onClick={logout} variant="outline">
            Sair
          </Button>
        </div>

        {/* Formulário para novo agendamento */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Novo Agendamento Automático
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="diaSemana">Dia da Semana</Label>
                <Select 
                  value={novoAgendamento.diaSemana.toString()} 
                  onValueChange={(value) => setNovoAgendamento(prev => ({ ...prev, diaSemana: parseInt(value) }))}
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
                <Label htmlFor="horario">Horário</Label>
                <Input
                  id="horario"
                  type="time"
                  value={novoAgendamento.horario}
                  onChange={(e) => setNovoAgendamento(prev => ({ ...prev, horario: e.target.value }))}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleAdicionarAgendamento}
                  disabled={loading}
                  className="w-full"
                >
                  Adicionar Agendamento
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de agendamentos ativos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Agendamentos Configurados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agendamentos.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhum agendamento configurado
              </p>
            ) : (
              <div className="space-y-3">
                {agendamentos.map((agendamento) => (
                  <div key={agendamento.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">
                          {getDiaSemanaLabel(agendamento.diaSemana)} às {agendamento.horario}
                        </p>
                        <p className="text-sm text-gray-600">
                          Criado em: {agendamento.criadoEm && format(agendamento.criadoEm.toDate(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                      <Badge variant={agendamento.ativo ? "default" : "secondary"}>
                        {agendamento.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoverAgendamento(agendamento.id)}
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
              <p>• Os agendamentos configurados aqui irão automaticamente liberar as inscrições para as aulas nos horários definidos</p>
              <p>• O sistema verifica a cada minuto se há agendamentos para executar</p>
              <p>• Por padrão, as aulas são liberadas toda segunda-feira às 12:30</p>
              <p>• Você pode configurar múltiplos horários de liberação</p>
              <p>• As notificações automáticas serão enviadas aos alunos quando as inscrições forem liberadas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgendamentoAulas;
