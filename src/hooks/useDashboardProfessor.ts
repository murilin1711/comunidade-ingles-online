
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Aula {
  id: string;
  dia_semana: number;
  horario: string;
  link_meet: string;
  capacidade: number;
  ativa: boolean;
  professor_nome?: string;
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

export const useDashboardProfessor = () => {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [aulaSelecionada, setAulaSelecionada] = useState<string>('');
  const [confirmados, setConfirmados] = useState<Inscricao[]>([]);
  const [listaEspera, setListaEspera] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

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
    if (!aulaSelecionada) return;

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
          semanas = 0;
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

  useEffect(() => {
    if (user) {
      fetchAulas();
    }
  }, [user]);

  useEffect(() => {
    fetchInscricoes();
  }, [aulaSelecionada]);

  return {
    aulas,
    aulaSelecionada,
    setAulaSelecionada,
    confirmados,
    listaEspera,
    loading,
    fetchAulas,
    handleMarcarPresenca,
    handleMarcarFalta
  };
};
