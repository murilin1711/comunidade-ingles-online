import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Users, Clock, Check, X, Trash2, CheckCircle, Calendar } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
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

interface Aluno {
  id: string;
  aluno_id: string;
  timestamp_inscricao: string;
  posicao_espera?: number;
  presenca?: boolean | null;
  aluno?: {
    nome: string;
    matricula: string;
    email: string;
  } | null;
}

interface HistoricoAula {
  id: string;
  dia_semana: number;
  horario: string;
  nivel: string;
  professor_nome: string;
  data_aula?: string | null;
  capacidade: number;
  ativa: boolean;
  inscricoes_abertas: boolean;
  confirmados?: Aluno[];
  presentes?: Aluno[];
  faltas?: Aluno[];
  listaEspera?: Aluno[];
  avisosFalta?: Array<{
    id: string;
    aluno_id: string;
    aula_id: string;
    status: string;
  }>;
  status_alterado_por?: string;
  status_alterado_em?: string;
  status_alterado_por_tipo?: string;
}

interface HistoricoAulaModalProps {
  aula: HistoricoAula;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAulaApagada?: () => void;
}

const diasSemana = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
];

const HistoricoAulaModal = ({ aula, open, onOpenChange, onAulaApagada }: HistoricoAulaModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('confirmados');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatarTimestamp = (timestamp: string) => {
    const data = new Date(timestamp);
    const milissegundos = data.getMilliseconds().toString().padStart(3, '0');
    const dataFormatada = data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    return `${dataFormatada}.${milissegundos}`;
  };

  const filtrarAlunos = (alunos: Aluno[]) => {
    if (!searchTerm) return alunos;
    return alunos.filter(aluno => 
      aluno.aluno?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aluno.aluno?.matricula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aluno.aluno?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const exportarCSV = (dados: Aluno[], tipo: string) => {
    const headers = tipo === 'confirmados' 
      ? ['Matrícula', 'Nome Completo', 'E-mail', 'Presença', 'Data Inscrição']
      : ['Posição', 'Matrícula', 'Nome Completo', 'E-mail', 'Data Inscrição'];

    const linhas = dados.map((aluno, index) => {
      const presencaTexto = aluno.presenca === true ? 'Presente' : 
                           aluno.presenca === false ? 'Falta' : 'Não marcado';
      
      return tipo === 'confirmados'
        ? [
            aluno.aluno?.matricula || 'N/A',
            aluno.aluno?.nome || 'Nome não disponível',
            aluno.aluno?.email || 'N/A',
            presencaTexto,
            formatarTimestamp(aluno.timestamp_inscricao)
          ]
        : [
            `${index + 1}º`,
            aluno.aluno?.matricula || 'N/A',
            aluno.aluno?.nome || 'Nome não disponível',
            aluno.aluno?.email || 'N/A',
            formatarTimestamp(aluno.timestamp_inscricao)
          ];
    });

    const csvContent = [headers, ...linhas]
      .map(linha => linha.map(campo => `"${campo}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${diasSemana[aula.dia_semana]}_${aula.horario}_${tipo}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const marcarComoRealizada = async () => {
    try {
      setLoading(true);

      // Verificar se a aula já foi realizada
      const aulaRealizada = aula.data_aula && new Date(aula.data_aula) < new Date();
      const novoStatus = aulaRealizada ? null : new Date().toISOString().split('T')[0];
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Verificar se o usuário é admin
      const { data: adminData } = await supabase
        .from('administradores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      const { error } = await supabase
        .from('aulas')
        .update({
          data_aula: novoStatus,
          status_alterado_por: user.id,
          status_alterado_em: new Date().toISOString(),
          status_alterado_por_tipo: adminData ? 'admin' : 'professor'
        })
        .eq('id', aula.id);

      if (error) throw error;

      toast.success(aulaRealizada ? 'Aula marcada como agendada!' : 'Aula marcada como realizada!');
      if (onAulaApagada) onAulaApagada(); // Trigger refresh
    } catch (error: any) {
      console.error('Erro ao alterar status da aula:', error);
      toast.error(`Erro ao alterar status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const apagarAulaPermanentemente = async () => {
    try {
      setLoading(true);

      // Primeiro deletar todas as inscrições relacionadas
      const { error: inscricoesError } = await supabase
        .from('inscricoes')
        .delete()
        .eq('aula_id', aula.id);

      if (inscricoesError) throw inscricoesError;

      // Depois deletar a aula
      const { error: aulaError } = await supabase
        .from('aulas')
        .delete()
        .eq('id', aula.id);

      if (aulaError) throw aulaError;

      toast.success('Aula apagada permanentemente com sucesso!');
      onOpenChange(false);
      if (onAulaApagada) onAulaApagada();
    } catch (error: any) {
      console.error('Erro ao apagar aula:', error);
      toast.error(`Erro ao apagar aula: ${error.message}`);
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const confirmados = filtrarAlunos(aula.confirmados || []);
  const listaEspera = filtrarAlunos(aula.listaEspera || []);
  
  // Buscar dados dos avisos de falta com informações do aluno
  const [avisosFaltaComAluno, setAvisosFaltaComAluno] = useState<Array<{
    id: string;
    aluno_id: string;
    data_aviso: string;
    status: string;
    motivo?: string;
    aluno?: {
      nome: string;
      matricula: string;
      email: string;
    };
  }>>([]);

  React.useEffect(() => {
    const buscarAvisosFalta = async () => {
      if (!aula.avisosFalta || aula.avisosFalta.length === 0) {
        setAvisosFaltaComAluno([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('avisos_falta')
          .select(`
            id,
            aluno_id,
            data_aviso,
            status,
            motivo,
            aluno:alunos!avisos_falta_aluno_id_fkey(
              nome,
              matricula,
              email
            )
          `)
          .eq('aula_id', aula.id)
          .order('data_aviso', { ascending: false });

        if (error) throw error;
        setAvisosFaltaComAluno(data || []);
      } catch (error) {
        console.error('Erro ao buscar avisos de falta:', error);
      }
    };

    if (open) {
      buscarAvisosFalta();
    }
  }, [aula.id, aula.avisosFalta, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-black flex items-center gap-2">
            <Users className="w-5 h-5" />
            {diasSemana[aula.dia_semana]} - {aula.horario} ({aula.nivel})
          </DialogTitle>
          <div className="text-sm text-black/60 space-y-1">
            <div>
              Professor: {aula.professor_nome}
              {aula.data_aula && (
                <span className="ml-2">
                  • {format(new Date(aula.data_aula), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={aula.inscricoes_abertas ? "default" : "secondary"} 
                     className={aula.inscricoes_abertas ? "bg-blue-500 text-white" : ""}>
                {aula.inscricoes_abertas ? "Inscrições Abertas" : "Inscrições Fechadas"}
              </Badge>
              <Badge variant={aula.ativa ? "default" : "secondary"} 
                     className={aula.ativa ? "bg-green-500 text-white" : ""}>
                {aula.ativa ? "Aula Ativa" : "Aula Inativa"}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 border border-black/20">
            <TabsTrigger value="confirmados" className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Confirmados ({confirmados.length})
            </TabsTrigger>
            <TabsTrigger value="lista-espera" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Lista de Espera ({listaEspera.length})
            </TabsTrigger>
            <TabsTrigger value="faltas" className="flex items-center gap-2">
              <X className="w-4 h-4" />
              Faltas ({(aula.avisosFalta || []).length})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-black/40" />
              <Input
                placeholder="Buscar por nome, matrícula ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-black/30"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => exportarCSV(
                activeTab === 'confirmados' ? confirmados : 
                activeTab === 'lista-espera' ? listaEspera : 
                (aula.avisosFalta || []).map(aviso => ({
                  id: aviso.id,
                  aluno_id: aviso.aluno_id,
                  timestamp_inscricao: '',
                  aluno: { nome: 'Aviso de Falta', matricula: '', email: '' }
                })),
                activeTab
              )}
              className="border-black/30 text-black hover:bg-yellow-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>

            <Button
              onClick={marcarComoRealizada}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {aula.data_aula && new Date(aula.data_aula) < new Date() ? (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Marcar como Agendada
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marcar como Realizada
                </>
              )}
            </Button>
            
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Apagar Aula
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
                    • Todas as inscrições dos alunos ({(aula.confirmados?.length || 0) + (aula.listaEspera?.length || 0)} inscrições)
                    <br />
                    • Histórico relacionado à esta aula
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={apagarAulaPermanentemente}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Apagar Permanentemente
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <TabsContent value="confirmados">
            <div className="border border-black/20 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-black font-medium">Matrícula</TableHead>
                    <TableHead className="text-black font-medium">Nome Completo</TableHead>
                    <TableHead className="text-black font-medium">E-mail</TableHead>
                    <TableHead className="text-black font-medium">Presença</TableHead>
                    <TableHead className="text-black font-medium">Data Inscrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {confirmados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-black/60">
                        {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum aluno confirmado'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    confirmados.map((aluno) => (
                      <TableRow key={aluno.id}>
                        <TableCell className="font-medium text-black">
                          {aluno.aluno?.matricula || 'N/A'}
                        </TableCell>
                        <TableCell className="text-black">
                          {aluno.aluno?.nome || 'Nome não disponível'}
                        </TableCell>
                        <TableCell className="text-black">
                          {aluno.aluno?.email || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            // Verificar se há aviso de falta para este aluno nesta aula
                            const temAvisoFalta = aula.avisosFalta?.some(aviso => 
                              aviso.aluno_id === aluno.aluno_id && aviso.aula_id === aula.id
                            );

                            if (aluno.presenca === null) {
                              if (temAvisoFalta) {
                                return (
                                  <Badge className="bg-orange-500 text-white">
                                    <X className="w-3 h-3 mr-1" />
                                    Falta com Aviso
                                  </Badge>
                                );
                              }
                              return (
                                <Badge variant="outline" className="border-gray-300 text-gray-600">
                                  Não marcado
                                </Badge>
                              );
                            } else if (aluno.presenca) {
                              return (
                                <Badge className="bg-green-500 text-white">
                                  <Check className="w-3 h-3 mr-1" />
                                  Presente
                                </Badge>
                              );
                            } else {
                              if (temAvisoFalta) {
                                return (
                                  <Badge className="bg-orange-500 text-white">
                                    <X className="w-3 h-3 mr-1" />
                                    Falta com Aviso
                                  </Badge>
                                );
                              }
                              return (
                                <Badge className="bg-red-500 text-white">
                                  <X className="w-3 h-3 mr-1" />
                                  Falta sem Aviso
                                </Badge>
                              );
                            }
                          })()}
                        </TableCell>
                        <TableCell className="text-black text-sm">
                          {formatarTimestamp(aluno.timestamp_inscricao)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="lista-espera">
            <div className="border border-black/20 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-black font-medium">Posição</TableHead>
                    <TableHead className="text-black font-medium">Matrícula</TableHead>
                    <TableHead className="text-black font-medium">Nome Completo</TableHead>
                    <TableHead className="text-black font-medium">E-mail</TableHead>
                    <TableHead className="text-black font-medium">Data Inscrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listaEspera.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-black/60">
                        {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum aluno na lista de espera'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    listaEspera.map((aluno, index) => (
                      <TableRow key={aluno.id}>
                        <TableCell>
                          <Badge className="bg-orange-500 text-white min-w-[32px] h-6 flex items-center justify-center">
                            {index + 1}º
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-black">
                          {aluno.aluno?.matricula || 'N/A'}
                        </TableCell>
                        <TableCell className="text-black">
                          {aluno.aluno?.nome || 'Nome não disponível'}
                        </TableCell>
                        <TableCell className="text-black">
                          {aluno.aluno?.email || 'N/A'}
                        </TableCell>
                        <TableCell className="text-black text-sm">
                          {formatarTimestamp(aluno.timestamp_inscricao)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="faltas">
            <div className="border border-black/20 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-black font-medium">Matrícula</TableHead>
                    <TableHead className="text-black font-medium">Nome Completo</TableHead>
                    <TableHead className="text-black font-medium">E-mail</TableHead>
                    <TableHead className="text-black font-medium">Status</TableHead>
                    <TableHead className="text-black font-medium">Data do Aviso</TableHead>
                    <TableHead className="text-black font-medium">Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {avisosFaltaComAluno.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-black/60">
                        {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum aviso de falta para esta aula'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    avisosFaltaComAluno
                      .filter(aviso => {
                        if (!searchTerm) return true;
                        return aviso.aluno?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               aviso.aluno?.matricula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               aviso.aluno?.email?.toLowerCase().includes(searchTerm.toLowerCase());
                      })
                      .map((aviso) => (
                        <TableRow key={aviso.id}>
                          <TableCell className="font-medium text-black">
                            {aviso.aluno?.matricula || 'N/A'}
                          </TableCell>
                          <TableCell className="text-black">
                            {aviso.aluno?.nome || 'Nome não disponível'}
                          </TableCell>
                          <TableCell className="text-black">
                            {aviso.aluno?.email || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={
                                aviso.status === 'pendente' ? 'bg-orange-500 text-white' : 
                                aviso.status === 'aplicado' ? 'bg-red-500 text-white' : 
                                'bg-gray-500 text-white'
                              }
                            >
                              <X className="w-3 h-3 mr-1" />
                              {aviso.status === 'pendente' ? 'Pendente' : 
                               aviso.status === 'aplicado' ? 'Suspensão Aplicada' : 
                               aviso.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-black text-sm">
                            {format(new Date(aviso.data_aviso), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-black text-sm">
                            {aviso.motivo || 'Sem motivo especificado'}
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default HistoricoAulaModal;