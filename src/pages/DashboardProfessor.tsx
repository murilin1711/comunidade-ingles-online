
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import Logo from '@/components/Logo';

interface Aula {
  id: string;
  dia_semana: number;
  horario: string;
  link_meet: string;
  capacidade: number;
}

interface Inscricao {
  id: string;
  aula_id: string;
  aluno_id: string;
  status: 'confirmado' | 'espera';
  posicao_espera?: number;
  data_inscricao: string;
  presenca?: boolean;
  aluno?: {
    nome: string;
    matricula: string;
  };
}

const DashboardProfessor = () => {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [aulaSelecionada, setAulaSelecionada] = useState<string>('');
  const [confirmados, setConfirmados] = useState<Inscricao[]>([]);
  const [listaEspera, setListaEspera] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, userData, logout } = useAuth();

  const diasSemana = [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
  ];

  useEffect(() => {
    if (user && userData?.role === 'professor') {
      fetchAulas();
    }
  }, [user, userData]);

  useEffect(() => {
    if (aulaSelecionada) {
      fetchInscricoes();
    }
  }, [aulaSelecionada]);

  const fetchAulas = async () => {
    try {
      const { data, error } = await supabase
        .from('aulas')
        .select('*')
        .eq('professor_id', user?.id)
        .eq('ativa', true)
        .order('dia_semana', { ascending: true })
        .order('horario', { ascending: true });

      if (error) throw error;
      setAulas(data || []);
    } catch (error) {
      console.error('Erro ao buscar aulas:', error);
      toast.error('Erro ao carregar aulas');
    }
  };

  const fetchInscricoes = async () => {
    try {
      // Buscar confirmados
      const { data: confirmadosData, error: confirmadosError } = await supabase
        .from('inscricoes')
        .select(`
          *,
          aluno:alunos!inscricoes_aluno_id_fkey(nome, matricula)
        `)
        .eq('aula_id', aulaSelecionada)
        .eq('status', 'confirmado')
        .is('cancelamento', null);

      if (confirmadosError) throw confirmadosError;

      // Buscar lista de espera
      const { data: esperaData, error: esperaError } = await supabase
        .from('inscricoes')
        .select(`
          *,
          aluno:alunos!inscricoes_aluno_id_fkey(nome, matricula)
        `)
        .eq('aula_id', aulaSelecionada)
        .eq('status', 'espera')
        .is('cancelamento', null)
        .order('data_inscricao', { ascending: true });

      if (esperaError) throw esperaError;

      // Type assertion to fix TypeScript errors
      setConfirmados((confirmadosData || []).map(item => ({
        ...item,
        status: item.status as 'confirmado' | 'espera'
      })));
      setListaEspera((esperaData || []).map(item => ({
        ...item,
        status: item.status as 'confirmado' | 'espera'
      })));
    } catch (error) {
      console.error('Erro ao buscar inscrições:', error);
      toast.error('Erro ao carregar inscrições');
    }
  };

  const handleMarcarPresenca = async (inscricaoId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('inscricoes')
        .update({ presenca: true, atualizado_em: new Date().toISOString() })
        .eq('id', inscricaoId);

      if (error) throw error;

      toast.success('Presença marcada!');
      await fetchInscricoes();
    } catch (error) {
      console.error('Erro ao marcar presença:', error);
      toast.error('Erro ao marcar presença');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelamento = async (inscricaoId: string, motivo: string) => {
    setLoading(true);
    try {
      // Marcar cancelamento
      const { error: updateError } = await supabase
        .from('inscricoes')
        .update({
          cancelamento: new Date().toISOString(),
          motivo_cancelamento: motivo,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', inscricaoId);

      if (updateError) throw updateError;

      // Promover aluno da lista de espera se necessário
      if (aulaSelecionada) {
        const { error: promoverError } = await supabase.rpc('promover_lista_espera', {
          aula_uuid: aulaSelecionada
        });

        if (promoverError) {
          console.error('Erro ao promover lista de espera:', promoverError);
        }
      }

      toast.success('Cancelamento processado!');
      await fetchInscricoes();
    } catch (error) {
      console.error('Erro ao processar cancelamento:', error);
      toast.error('Erro ao processar cancelamento');
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarFalta = async (alunoId: string, tipo: string) => {
    setLoading(true);
    try {
      let motivo = '';
      let semanas = 0;

      switch (tipo) {
        case 'cancel≥4h':
          motivo = 'cancelamento_4h';
          semanas = 0; // Sem suspensão
          break;
        case 'cancel<4h':
          motivo = 'cancelamento_menos_4h';
          semanas = 1;
          break;
        case 'falta':
          motivo = 'falta';
          semanas = 2;
          break;
      }

      if (semanas > 0) {
        // Aplicar suspensão
        const { error: suspensaoError } = await supabase.rpc('aplicar_suspensao', {
          aluno_uuid: alunoId,
          motivo_param: motivo,
          semanas_param: semanas
        });

        if (suspensaoError) throw suspensaoError;
      }

      // Marcar a inscrição como cancelada
      const inscricao = confirmados.find(i => i.aluno_id === alunoId);
      if (inscricao) {
        await handleCancelamento(inscricao.id, motivo);
      }

      toast.success(`Ação processada! ${semanas > 0 ? `Aluno suspenso por ${semanas} semana(s).` : ''}`);
    } catch (error) {
      console.error('Erro ao processar falta:', error);
      toast.error('Erro ao processar ação');
    } finally {
      setLoading(false);
    }
  };

  const aulaSelecionadaData = aulas.find(a => a.id === aulaSelecionada);

  if (!userData || userData.role !== 'professor') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-black mb-2">Acesso negado</h2>
          <p className="text-black/60">Esta área é restrita para professores.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Logo size="md" />
            <div>
              <h1 className="text-3xl font-bold text-black">Dashboard do Professor</h1>
              <p className="text-black/70">Bem-vindo, {userData.nome}!</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => window.location.href = '/agendamento'} 
              variant="outline"
              className="border-black/30 text-black hover:bg-yellow-200"
            >
              Agendamento
            </Button>
            <Button 
              onClick={logout} 
              variant="outline"
              className="border-black/30 text-black hover:bg-yellow-200"
            >
              Sair
            </Button>
          </div>
        </div>

        <Card className="mb-6 border-black/20">
          <CardHeader>
            <CardTitle className="text-black">Selecionar Aula</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={aulaSelecionada} onValueChange={setAulaSelecionada}>
              <SelectTrigger className="w-full border-black/20 focus:border-yellow-500 focus:ring-yellow-500">
                <SelectValue placeholder="Selecione uma aula" />
              </SelectTrigger>
              <SelectContent>
                {aulas.map((aula) => (
                  <SelectItem key={aula.id} value={aula.id}>
                    {diasSemana[aula.dia_semana]} - {aula.horario}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {aulaSelecionada && aulaSelecionadaData && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Confirmados */}
            <Card className="border-black/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-black">
                  Confirmados
                  <Badge className="bg-yellow-500 text-black">{confirmados.length}/{aulaSelecionadaData.capacidade}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {confirmados.map((inscricao) => (
                  <div key={inscricao.id} className="border border-black/20 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-black">{inscricao.aluno?.nome || 'Nome não encontrado'}</p>
                        <p className="text-sm text-black/60">Matrícula: {inscricao.aluno?.matricula}</p>
                      </div>
                      {inscricao.presenca && (
                        <Badge className="bg-green-500 text-white">Presente</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!inscricao.presenca && (
                        <Button
                          size="sm"
                          onClick={() => handleMarcarPresenca(inscricao.id)}
                          disabled={loading}
                          className="bg-yellow-500 hover:bg-yellow-600 text-black"
                        >
                          Presença
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarcarFalta(inscricao.aluno_id, 'cancel≥4h')}
                        disabled={loading}
                        className="border-black/30 text-black hover:bg-yellow-50"
                      >
                        Cancel ≥4h
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarcarFalta(inscricao.aluno_id, 'cancel<4h')}
                        disabled={loading}
                        className="border-black/30 text-black hover:bg-yellow-50"
                      >
                        Cancel &lt;4h
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleMarcarFalta(inscricao.aluno_id, 'falta')}
                        disabled={loading}
                      >
                        Falta sem aviso
                      </Button>
                    </div>
                  </div>
                ))}
                {confirmados.length === 0 && (
                  <p className="text-black/60 text-center">Nenhum aluno confirmado</p>
                )}
              </CardContent>
            </Card>

            {/* Lista de Espera */}
            <Card className="border-black/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-black">
                  Lista de Espera
                  <Badge variant="secondary" className="bg-black/10 text-black">{listaEspera.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {listaEspera.map((inscricao, index) => (
                  <div key={inscricao.id} className="border border-black/20 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-black">{inscricao.aluno?.nome || 'Nome não encontrado'}</p>
                        <p className="text-sm text-black/60">Posição: {index + 1}</p>
                        <p className="text-xs text-black/40">
                          {new Date(inscricao.data_inscricao).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(inscricao.data_inscricao).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {listaEspera.length === 0 && (
                  <p className="text-black/60 text-center">Lista de espera vazia</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardProfessor;
