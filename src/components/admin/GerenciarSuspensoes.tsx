
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { AlertTriangle, Users, Clock, RefreshCw } from 'lucide-react';
import AvisosFaltaCard from './AvisosFaltaCard';
import SuspensaoAtivaCard from './SuspensaoAtivaCard';
import { Button } from '@/components/ui/button';

interface AvisoFalta {
  id: string;
  aluno_id: string;
  aula_id: string;
  data_aviso: string;
  status: string;
  motivo?: string;
  aluno: {
    nome: string;
    matricula: string;
    telefone: string;
    email: string;
  };
  aula: {
    dia_semana: number;
    horario: string;
    nivel: string;
    professor_nome: string;
    data_aula: string;
  };
}

interface SuspensaoAtiva {
  id: string;
  aluno_id: string;
  semanas: number;
  data_inicio: string;
  data_fim: string;
  ativa: boolean;
  motivo: string;
  aluno: {
    nome: string;
    matricula: string;
    telefone: string;
  };
}

const GerenciarSuspensoes = () => {
  const [avisosFalta, setAvisosFalta] = useState<AvisoFalta[]>([]);
  const [suspensoesAtivas, setSuspensoesAtivas] = useState<SuspensaoAtiva[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAvisosFalta = async () => {
    try {
      const { data, error } = await supabase
        .from('avisos_falta')
        .select(`
          id,
          aluno_id,
          aula_id,
          data_aviso,
          status,
          motivo,
          aluno:alunos!avisos_falta_aluno_id_fkey(
            nome,
            matricula,
            telefone,
            email
          ),
          aula:aulas!avisos_falta_aula_id_fkey(
            dia_semana,
            horario,
            nivel,
            professor_nome,
            data_aula
          )
        `)
        .eq('status', 'pendente')
        .order('data_aviso', { ascending: false });

      if (error) throw error;
      setAvisosFalta(data || []);
    } catch (error) {
      console.error('Erro ao buscar avisos de falta:', error);
      toast.error('Erro ao carregar avisos de falta');
    }
  };

  const fetchSuspensoesAtivas = async () => {
    try {
      const { data, error } = await supabase
        .from('suspensoes')
        .select(`
          id,
          aluno_id,
          semanas,
          data_inicio,
          data_fim,
          ativa,
          motivo,
          aluno:alunos!suspensoes_aluno_id_fkey(
            nome,
            matricula,
            telefone
          )
        `)
        .eq('ativa', true)
        .gt('data_fim', new Date().toISOString())
        .order('data_fim', { ascending: true });

      if (error) throw error;
      setSuspensoesAtivas(data || []);
    } catch (error) {
      console.error('Erro ao buscar suspensões ativas:', error);
      toast.error('Erro ao carregar suspensões ativas');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchAvisosFalta(), fetchSuspensoesAtivas()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAplicarSuspensao = async (avisoId: string, tipoSuspensao: string) => {
    try {
      setLoading(true);
      
      // Buscar detalhes do aviso
      const { data: avisoData, error: avisoError } = await supabase
        .from('avisos_falta')
        .select('aluno_id, aula_id')
        .eq('id', avisoId)
        .single();

      if (avisoError) throw avisoError;

      // Primeiro, cancelar a inscrição do aluno na aula específica
      const { error: cancelError } = await supabase
        .from('inscricoes')
        .update({
          cancelamento: new Date().toISOString(),
          motivo_cancelamento: 'Aviso de falta - Suspensão aplicada'
        })
        .eq('aluno_id', avisoData.aluno_id)
        .eq('aula_id', avisoData.aula_id)
        .is('cancelamento', null);

      if (cancelError) {
        console.error('Erro ao cancelar inscrição:', cancelError);
        // Continue mesmo se não conseguir cancelar a inscrição
      }

      // Aplicar suspensão usando a função do banco
      const { error: suspensaoError } = await supabase.rpc(
        'aplicar_suspensao',
        {
          aluno_uuid: avisoData.aluno_id,
          motivo_param: tipoSuspensao,
          semanas_param: tipoSuspensao === 'aviso_4h' ? 2 :
                        tipoSuspensao === 'aviso_menos_4h' ? 3 : 4
        }
      );

      if (suspensaoError) throw suspensaoError;

      // Atualizar status do aviso
      const { error: updateError } = await supabase
        .from('avisos_falta')
        .update({
          status: 'aplicado',
          tipo_suspensao: tipoSuspensao,
          data_aplicacao: new Date().toISOString()
        })
        .eq('id', avisoId);

      if (updateError) throw updateError;

      toast.success('Suspensão aplicada com sucesso! O aluno foi removido da lista e suspenso.');
      fetchData();
    } catch (error) {
      console.error('Erro ao aplicar suspensão:', error);
      toast.error('Erro ao aplicar suspensão');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarSuspensao = async (suspensaoId: string) => {
    try {
      setLoading(true);

      // Buscar dados da suspensão
      const { data: suspensaoData, error: selectError } = await supabase
        .from('suspensoes')
        .select('aluno_id')
        .eq('id', suspensaoId)
        .single();

      if (selectError) {
        console.error('Erro ao buscar suspensão:', selectError);
        throw new Error(`Erro ao buscar suspensão: ${selectError.message}`);
      }

      // Desativar suspensão primeiro
      const { error: updateSuspensaoError } = await supabase
        .from('suspensoes')
        .update({ 
          ativa: false,
          data_fim: new Date().toISOString()
        })
        .eq('id', suspensaoId);

      if (updateSuspensaoError) {
        console.error('Erro ao desativar suspensão:', updateSuspensaoError);
        throw new Error(`Erro ao desativar suspensão: ${updateSuspensaoError.message}`);
      }

      // Depois atualizar status do aluno
      const { error: updateAlunoError } = await supabase
        .from('alunos')
        .update({
          status_suspenso: false,
          fim_suspensao: null,
          atualizado_em: new Date().toISOString()
        })
        .eq('user_id', suspensaoData.aluno_id);

      if (updateAlunoError) {
        console.error('Erro ao atualizar aluno:', updateAlunoError);
        throw new Error(`Erro ao atualizar aluno: ${updateAlunoError.message}`);
      }

      toast.success('Suspensão cancelada com sucesso!');
      fetchData();
    } catch (error: any) {
      console.error('Erro ao cancelar suspensão:', error);
      toast.error(error.message || 'Erro ao cancelar suspensão');
    } finally {
      setLoading(false);
    }
  };

  const handleEditarPeriodo = async (suspensaoId: string, novaDataFim: Date) => {
    try {
      setLoading(true);

      // Buscar dados da suspensão
      const { data: suspensaoData, error: selectError } = await supabase
        .from('suspensoes')
        .select('aluno_id, data_inicio')
        .eq('id', suspensaoId)
        .single();

      if (selectError) {
        console.error('Erro ao buscar suspensão:', selectError);
        throw new Error(`Erro ao buscar suspensão: ${selectError.message}`);
      }

      // Calcular nova duração em semanas
      const dataInicio = new Date(suspensaoData.data_inicio);
      const diffTime = novaDataFim.getTime() - dataInicio.getTime();
      const novasSemanas = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));

      // Verificar se ainda está suspenso baseado na nova data
      const agora = new Date();
      const aindaSuspenso = novaDataFim > agora;

      // Primeiro atualizar suspensão
      const { error: updateSuspensaoError } = await supabase
        .from('suspensoes')
        .update({ 
          data_fim: novaDataFim.toISOString(),
          semanas: novasSemanas,
          ativa: aindaSuspenso
        })
        .eq('id', suspensaoId);

      if (updateSuspensaoError) {
        console.error('Erro ao atualizar suspensão:', updateSuspensaoError);
        throw new Error(`Erro ao atualizar suspensão: ${updateSuspensaoError.message}`);
      }

      // Depois atualizar dados do aluno
      const { error: updateAlunoError } = await supabase
        .from('alunos')
        .update({ 
          fim_suspensao: aindaSuspenso ? novaDataFim.toISOString() : null,
          status_suspenso: aindaSuspenso,
          atualizado_em: new Date().toISOString()
        })
        .eq('user_id', suspensaoData.aluno_id);

      if (updateAlunoError) {
        console.error('Erro ao atualizar aluno:', updateAlunoError);
        throw new Error(`Erro ao atualizar aluno: ${updateAlunoError.message}`);
      }

      toast.success('Período da suspensão atualizado com sucesso!');
      fetchData();
    } catch (error: any) {
      console.error('Erro ao editar período:', error);
      toast.error(error.message || 'Erro ao editar período da suspensão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Seção Superior: Avisos e Faltas */}
      <Card className="border-orange-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-black flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Avisos e Faltas de Alunos
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-black/60">
                {avisosFalta.length} pendente(s)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                disabled={loading}
                className="border-black/30"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-40 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : avisosFalta.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-black/30 mx-auto mb-4" />
              <p className="text-black/60 text-lg font-medium mb-2">
                Nenhum aviso de falta pendente
              </p>
              <p className="text-black/40">
                Quando alunos clicarem em "Avisar Falta", aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {avisosFalta.map((aviso) => (
                <AvisosFaltaCard
                  key={aviso.id}
                  aviso={aviso}
                  onAplicarSuspensao={handleAplicarSuspensao}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Seção Inferior: Suspensões Ativas */}
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-black flex items-center gap-2">
              <Users className="w-5 h-5 text-red-600" />
              Suspensões de Alunos
            </CardTitle>
            <span className="text-sm text-black/60">
              {suspensoesAtivas.length} ativa(s)
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-40 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : suspensoesAtivas.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-black/30 mx-auto mb-4" />
              <p className="text-black/60 text-lg font-medium mb-2">
                Nenhuma suspensão ativa
              </p>
              <p className="text-black/40">
                Suspensões aplicadas aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suspensoesAtivas.map((suspensao) => (
                <SuspensaoAtivaCard
                  key={suspensao.id}
                  suspensao={suspensao}
                  onCancelarSuspensao={handleCancelarSuspensao}
                  onEditarPeriodo={handleEditarPeriodo}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GerenciarSuspensoes;
