
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface Aula {
  id: string;
  dia_semana: number;
  horario: string;
  link_meet: string;
  capacidade: number;
  ativa: boolean;
  professor_nome?: string;
  nivel: string;
}

interface Confirmado {
  id: string;
  aluno_id: string;
  timestamp_inscricao: string;
  aluno?: {
    nome: string;
    matricula: string;
  } | null;
  presenca: boolean | null;
}

interface AlunoEspera {
  id: string;
  aluno_id: string;
  posicao_espera: number;
  timestamp_inscricao: string;
  aluno?: {
    nome: string;
    matricula: string;
  } | null;
}

export const useDashboardProfessor = () => {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [aulaSelecionada, setAulaSelecionada] = useState<string>('');
  const [confirmados, setConfirmados] = useState<Confirmado[]>([]);
  const [listaEspera, setListaEspera] = useState<AlunoEspera[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAulas();
    }
  }, [user]);

  useEffect(() => {
    if (aulaSelecionada) {
      fetchInscricoes();
    }
  }, [aulaSelecionada]);

  // Configurar atualização em tempo real
  useEffect(() => {
    if (!aulaSelecionada) return;

    const channel = supabase
      .channel('inscricoes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inscricoes',
          filter: `aula_id=eq.${aulaSelecionada}`
        },
        () => {
          fetchInscricoes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      
      // Se não há aula selecionada e existem aulas, selecionar a primeira
      if (!aulaSelecionada && data && data.length > 0) {
        setAulaSelecionada(data[0].id);
      }
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
          id,
          aluno_id,
          presenca,
          timestamp_inscricao,
          aluno:alunos(nome, matricula)
        `)
        .eq('aula_id', aulaSelecionada)
        .eq('status', 'confirmado')
        .is('cancelamento', null)
        .order('timestamp_inscricao', { ascending: true });

      if (confirmadosError) throw confirmadosError;

      // Buscar lista de espera
      const { data: esperaData, error: esperaError } = await supabase
        .from('inscricoes')
        .select(`
          id,
          aluno_id,
          posicao_espera,
          timestamp_inscricao,
          aluno:alunos(nome, matricula)
        `)
        .eq('aula_id', aulaSelecionada)
        .eq('status', 'espera')
        .is('cancelamento', null)
        .order('timestamp_inscricao', { ascending: true });

      if (esperaError) throw esperaError;

      // Filtrar apenas inscrições com dados do aluno válidos
      const confirmadosValidos = (confirmadosData || []).filter(item => item.aluno);
      const esperaValidos = (esperaData || []).filter(item => item.aluno);

      console.log('=== DEBUG ORDENAÇÃO ===');
      console.log('Dados confirmados recebidos:', confirmadosData);
      console.log('Confirmados válidos (ordenados por timestamp):', confirmadosValidos.map((c, index) => ({
        posicao: index + 1,
        nome: c.aluno?.nome,
        timestamp: c.timestamp_inscricao,
        id: c.id
      })));
      console.log('Dados espera recebidos:', esperaData);
      console.log('Espera válidos:', esperaValidos);

      setConfirmados(confirmadosValidos);
      setListaEspera(esperaValidos);
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
        .update({ presenca: true })
        .eq('id', inscricaoId);

      if (error) throw error;

      await fetchInscricoes();
      toast.success('Presença marcada com sucesso!');
    } catch (error) {
      console.error('Erro ao marcar presença:', error);
      toast.error('Erro ao marcar presença');
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarFalta = async (inscricaoId: string) => {
    setLoading(true);
    try {
      // Buscar dados da inscrição
      const { data: inscricao } = await supabase
        .from('inscricoes')
        .select('aluno_id')
        .eq('id', inscricaoId)
        .single();

      if (!inscricao) throw new Error('Inscrição não encontrada');

      // Marcar falta
      const { error: faltaError } = await supabase
        .from('inscricoes')
        .update({ presenca: false })
        .eq('id', inscricaoId);

      if (faltaError) throw faltaError;

      // Aplicar suspensão de 4 semanas por falta sem aviso
      const { error: suspensaoError } = await supabase.rpc('aplicar_suspensao', {
        aluno_uuid: inscricao.aluno_id,
        motivo_param: 'falta_sem_aviso',
        semanas_param: 4
      });

      if (suspensaoError) throw suspensaoError;

      // Promover próximo da lista de espera
      const { error: promoverError } = await supabase.rpc('promover_lista_espera', {
        aula_uuid: aulaSelecionada
      });

      if (promoverError) {
        console.error('Erro ao promover lista de espera:', promoverError);
      }

      await fetchInscricoes();
      toast.success('Falta marcada e aluno suspenso por 4 semanas');
    } catch (error) {
      console.error('Erro ao marcar falta:', error);
      toast.error('Erro ao marcar falta');
    } finally {
      setLoading(false);
    }
  };

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
