
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Edit, Search, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EditarAulaModal from './EditarAulaModal';
import YellowLoadingSpinner from '../YellowLoadingSpinner';

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
  inscricoes_count?: number;
}

interface GerenciarAulasAtivasProps {
  onEditarAula?: (aula: Aula) => void;
}

const GerenciarAulasAtivas = ({ onEditarAula }: GerenciarAulasAtivasProps) => {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState('todas');
  const [busca, setBusca] = useState('');
  const [aulaParaApagar, setAulaParaApagar] = useState<string | null>(null);
  const [aulaParaEditar, setAulaParaEditar] = useState<Aula | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingAula, setDeletingAula] = useState(false);

  const diasSemana = [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
  ];

  useEffect(() => {
    fetchAulas();
  }, []);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('aulas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'aulas'
        },
        () => {
          fetchAulas();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inscricoes'
        },
        () => {
          fetchAulas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAulas = async () => {
    try {
      setLoading(true);
      // Buscar TODAS as aulas, não apenas as ativas
      const { data, error } = await supabase
        .from('aulas')
        .select(`
          *,
          inscricoes!inscricoes_aula_id_fkey(
            id,
            status,
            cancelamento
          )
        `)
        .order('data_aula', { ascending: false })
        .order('horario');

      if (error) throw error;

      const aulasComContagem = data?.map(aula => ({
        ...aula,
        inscricoes_count: aula.inscricoes?.filter(i => 
          (i.status === 'confirmado' || i.status === 'espera') && !i.cancelamento
        ).length || 0
      })) || [];

      setAulas(aulasComContagem);
    } catch (error) {
      console.error('Erro ao buscar aulas:', error);
      toast.error('Erro ao carregar aulas');
    } finally {
      setLoading(false);
    }
  };

  const toggleAulaAtiva = async (aulaId: string, novoStatus: boolean) => {
    try {
      setLoading(true);
      
      if (novoStatus) {
        // REATIVANDO AULA - Criar uma nova aula com as mesmas configurações
        const confirmacao = window.confirm(
          '⚠️ REATIVAR AULA\n\n' +
          'Ao reativar esta aula, será criada uma NOVA AULA com as mesmas configurações:\n' +
          '• A aula anterior permanece no histórico com todos os dados\n' +
          '• Uma nova aula será criada (sem inscrições, sem faltas)\n' +
          '• Os alunos precisarão se inscrever novamente na nova aula\n' +
          '• As configurações (professor, horário, etc.) serão copiadas\n\n' +
          'Deseja continuar com a reativação?'
        );
        
        if (!confirmacao) {
          setLoading(false);
          return;
        }

        // Buscar dados da aula atual para criar nova
        const { data: aulaOriginal, error: fetchError } = await supabase
          .from('aulas')
          .select('*')
          .eq('id', aulaId)
          .single();

        if (fetchError) {
          console.error('Erro ao buscar aula original:', fetchError);
          throw fetchError;
        }

        // Criar nova aula com as mesmas configurações, mas sem data_aula (nova aula)
        const novaAulaData = {
          professor_id: aulaOriginal.professor_id,
          professor_nome: aulaOriginal.professor_nome,
          dia_semana: aulaOriginal.dia_semana,
          horario: aulaOriginal.horario,
          link_meet: aulaOriginal.link_meet,
          nivel: aulaOriginal.nivel,
          capacidade: aulaOriginal.capacidade,
          ativa: true,
          inscricoes_abertas: true,
          data_aula: null // Nova aula sem data específica
        };

        const { error: createError } = await supabase
          .from('aulas')
          .insert(novaAulaData);

        if (createError) {
          console.error('Erro ao criar nova aula:', createError);
          throw createError;
        }

        toast.success('Nova aula criada com sucesso! A aula anterior foi preservada no histórico.');
        
      } else {
        // DESATIVANDO AULA - Avisar que será salva no histórico
        const confirmacao = window.confirm(
          '⚠️ DESATIVAR AULA\n\n' +
          'Ao desativar esta aula:\n' +
          '• Todos os dados atuais serão preservados no histórico\n' +
          '• A aula ficará invisível para os alunos\n' +
          '• Você pode reativá-la depois (será criada uma nova aula)\n\n' +
          'Deseja continuar?'
        );
        
        if (!confirmacao) {
          setLoading(false);
          return;
        }
        
        // Apenas desativar a aula existente
        const { error } = await supabase
          .from('aulas')
          .update({ ativa: false })
          .eq('id', aulaId);

        if (error) {
          console.error('Erro na requisição:', error);
          throw error;
        }

        toast.success('Aula desativada com sucesso! Os dados foram salvos no histórico.');
      }
      
      // Refresh data to show changes
      setTimeout(() => fetchAulas(), 500);
    } catch (error: any) {
      console.error('Erro ao atualizar status da aula:', error);
      
      const errorMessage = error?.message || 'Erro desconhecido ao atualizar status da aula';
      toast.error(`Falha ao ${novoStatus ? 'reativar' : 'inativar'} aula: ${errorMessage}`);
      
      fetchAulas();
    } finally {
      setLoading(false);
    }
  };

  const apagarAulaPermanentemente = async (aulaId: string) => {
    try {
      setDeletingAula(true);

      // Primeiro deletar todas as inscrições relacionadas
      const { error: inscricoesError } = await supabase
        .from('inscricoes')
        .delete()
        .eq('aula_id', aulaId);

      if (inscricoesError) throw inscricoesError;

      // Depois deletar a aula
      const { error: aulaError } = await supabase
        .from('aulas')
        .delete()
        .eq('id', aulaId);

      if (aulaError) throw aulaError;

      toast.success('Aula apagada permanentemente com sucesso!');
      fetchAulas();
    } catch (error: any) {
      console.error('Erro ao apagar aula:', error);
      toast.error(`Erro ao apagar aula: ${error.message}`);
    } finally {
      setDeletingAula(false);
      setAulaParaApagar(null);
    }
  };

  const getStatusAula = (aula: Aula) => {
    // Se a aula não está ativa, considerar inativa
    if (!aula.ativa) return 'inativa';
    
    // Se não tem data definida, considerar ativa (aula recorrente)
    if (!aula.data_aula) return 'ativa';
    
    const dataAula = new Date(aula.data_aula);
    const hoje = new Date();
    
    // Se a data da aula já passou, considerar concluída
    if (dataAula < hoje) return 'concluida';
    
    return 'ativa';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativa':
        return <Badge className="bg-green-500 text-white">Ativa</Badge>;
      case 'inativa':
        return <Badge variant="secondary">Inativa</Badge>;
      case 'concluida':
        return <Badge className="bg-blue-500 text-white">Concluída</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const aulasFiltradas = aulas.filter(aula => {
    const status = getStatusAula(aula);
    
    // Filtro por status
    if (filtro !== 'todas') {
      if (filtro !== status) return false;
    }
    
    // Filtro por busca
    if (busca) {
      const termoBusca = busca.toLowerCase();
      const match = 
        aula.professor_nome?.toLowerCase().includes(termoBusca) ||
        aula.nivel.toLowerCase().includes(termoBusca) ||
        diasSemana[aula.dia_semana].toLowerCase().includes(termoBusca) ||
        aula.horario.includes(termoBusca);
      
      if (!match) return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filtros e Busca */}
      <Card className="border-black/20">
        <CardHeader>
          <CardTitle className="text-black">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Status</label>
              <Select value={filtro} onValueChange={setFiltro}>
                <SelectTrigger className="border-black/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="ativa">Ativas</SelectItem>
                  <SelectItem value="inativa">Inativas</SelectItem>
                  <SelectItem value="concluida">Concluídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/60 w-4 h-4" />
                <Input
                  placeholder="Professor, nível, dia, horário..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10 border-black/30"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Aulas */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8 text-black/60">Carregando aulas...</div>
        ) : aulasFiltradas.length === 0 ? (
          <div className="text-center py-8 text-black/60">Nenhuma aula encontrada</div>
        ) : (
          aulasFiltradas.map((aula) => {
            const status = getStatusAula(aula);
            
            return (
              <Card key={aula.id} className="border-black/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-black">
                          {diasSemana[aula.dia_semana]} - {aula.horario}
                        </h3>
                        {getStatusBadge(status)}
                        <Badge variant="outline" className="border-black/30">
                          {aula.nivel}
                        </Badge>
                         <Badge className="bg-yellow-500 text-black">
                          {aula.inscricoes_count || 0}/{aula.capacidade} vagas
                        </Badge>
                        <Badge variant={aula.inscricoes_abertas ? "default" : "secondary"} 
                               className={aula.inscricoes_abertas ? "bg-blue-500 text-white" : ""}>
                          {aula.inscricoes_abertas ? "Inscrições Abertas" : "Inscrições Fechadas"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-black/80">
                        <p><strong>Professor:</strong> {aula.professor_nome}</p>
                        {aula.data_aula && (
                          <p><strong>Data:</strong> {format(new Date(aula.data_aula), "dd/MM/yyyy", { locale: ptBR })}</p>
                        )}
                        <p className="break-all"><strong>Meet:</strong> {aula.link_meet}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-6">
                      {/* Toggle Ativo/Inativo - só mostrar se não for concluída */}
                      {status !== 'concluida' && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-black">
                            {aula.ativa ? 'Ativa' : 'Inativa'}
                          </span>
                          <Switch
                            checked={aula.ativa}
                            disabled={loading}
                            onCheckedChange={(checked) => toggleAulaAtiva(aula.id, checked)}
                          />
                          {loading && (
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-black"></div>
                          )}
                        </div>
                      )}

                      {/* Botão Editar */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setAulaParaEditar(aula);
                          setShowEditModal(true);
                        }}
                        className="border-black/30 text-black hover:bg-yellow-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      {/* Botão Apagar */}
                      <AlertDialog open={aulaParaApagar === aula.id} onOpenChange={(open) => !open && setAulaParaApagar(null)}>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setAulaParaApagar(aula.id)}
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Apagar Aula Permanentemente</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja apagar permanentemente a aula de{' '}
                              <strong>{diasSemana[aula.dia_semana]} às {aula.horario}</strong>?
                              <br />
                              <br />
                              Esta ação não pode ser desfeita e irá remover:
                              <br />
                              • A aula e todas suas configurações
                              <br />
                              • Todas as inscrições dos alunos
                              <br />
                              • Histórico relacionado à esta aula
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => apagarAulaPermanentemente(aula.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Apagar Permanentemente
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal de Edição */}
      <EditarAulaModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        aula={aulaParaEditar}
        onAulaEditada={() => {
          fetchAulas();
          setShowEditModal(false);
          setAulaParaEditar(null);
        }}
      />

      {/* Loading Spinner para operações de delete */}
      <YellowLoadingSpinner show={deletingAula} delay={500} />
    </div>
  );
};

export default GerenciarAulasAtivas;
