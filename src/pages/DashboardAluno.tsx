import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import Logo from '@/components/Logo';
import AvisarFaltaModal from '@/components/AvisarFaltaModal';
import EstatisticasPresencaAluno from '@/components/EstatisticasPresencaAluno';
import InscricoesDetalhes from '@/components/InscricoesDetalhes';
import VerificarAvisosPendentes from '@/components/VerificarAvisosPendentes';
import { SecurityWrapper } from '@/components/SecurityWrapper';
import { useSecurityCheck } from '@/hooks/useSecurityCheck';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Aula {
  id: string;
  dia_semana: number;
  horario: string;
  link_meet: string;
  capacidade: number;
  professor_nome: string;
  nivel: string;
  inscricoes_abertas: boolean;
  inscricoes_count: number;
  minha_inscricao?: {
    id: string;
    status: 'confirmado' | 'espera';
    posicao_espera?: number;
  };
}

const DashboardAluno = () => {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(false);
  const [configuracoes, setConfiguracoes] = useState<any>(null);
  const { user, userData, logout } = useAuth();
  const { isSecure, securityAlerts } = useSecurityCheck();

  const diasSemana = [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
  ];

  useEffect(() => {
    if (user && userData?.role === 'aluno') {
      fetchAulas();
      fetchConfiguracoes();
    }
  }, [user, userData]);

  const fetchConfiguracoes = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('*')
        .order('atualizado_em', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setConfiguracoes(data);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    }
  };

  // Real-time updates para sincronização automática
  useEffect(() => {
    if (!user || userData?.role !== 'aluno') return;

    const channel = supabase
      .channel('dashboard-aluno-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inscricoes'
        },
        () => {
          console.log('Inscricoes changed, updating dashboard...');
          fetchAulas();
        }
      )
       .on(
         'postgres_changes',
         {
           event: '*',
           schema: 'public',
           table: 'aulas'
         },
         () => {
           console.log('Aulas changed, updating dashboard...');
           fetchAulas();
         }
       )
       .on(
         'postgres_changes',
         {
           event: '*',
           schema: 'public',
           table: 'configuracoes_sistema'
         },
         () => {
           console.log('Configurações changed, updating dashboard...');
           fetchConfiguracoes();
         }
       )
       .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userData]);

  const fetchAulas = async () => {
    try {
      // Buscar todas as aulas ativas
      const { data: aulasData, error: aulasError } = await supabase
        .from('aulas')
        .select('*')
        .eq('ativa', true)
        .order('dia_semana', { ascending: true })
        .order('horario', { ascending: true });

      if (aulasError) throw aulasError;

      // Para cada aula, buscar o número de inscrições confirmadas e a inscrição do usuário atual
      const aulasComInscricoes = await Promise.all(
        (aulasData || []).map(async (aula) => {
          // Contar inscrições confirmadas
          const { count: inscricoesCount } = await supabase
            .from('inscricoes')
            .select('*', { count: 'exact' })
            .eq('aula_id', aula.id)
            .eq('status', 'confirmado')
            .is('cancelamento', null);

          // Buscar inscrição do usuário atual
          const { data: minhaInscricao } = await supabase
            .from('inscricoes')
            .select('id, status, posicao_espera')
            .eq('aula_id', aula.id)
            .eq('aluno_id', user?.id)
            .is('cancelamento', null)
            .maybeSingle();

          return {
            ...aula,
            inscricoes_count: inscricoesCount || 0,
            minha_inscricao: minhaInscricao ? {
              ...minhaInscricao,
              status: minhaInscricao.status as 'confirmado' | 'espera'
            } : undefined
          };
        })
      );

      setAulas(aulasComInscricoes);
    } catch (error) {
      console.error('Erro ao buscar aulas:', error);
      toast.error('Erro ao carregar aulas');
    }
  };

  const isAlunoSuspenso = () => {
    if (!userData || userData.role !== 'aluno') return false;
    if (!userData.statusSuspenso) return false;
    
    if (userData.fimSuspensao) {
      const agora = new Date();
      return userData.fimSuspensao > agora;
    }
    
    return false;
  };

  // Verifica se há pelo menos uma aula com inscrições abertas
  const isInscricaoAberta = () => {
    // Se há aulas com inscricoes_abertas = true, então as inscrições estão abertas
    const aulasComInscricoesAbertas = aulas.some(aula => aula.inscricoes_abertas);
    if (aulasComInscricoesAbertas) {
      return true;
    }

    // Senão, verificar pelo horário automático
    if (!configuracoes) {
      // Fallback para valores padrão
      const agora = new Date();
      const diaSemana = agora.getDay();
      const hora = agora.getHours();
      const minutos = agora.getMinutes();
      return diaSemana === 1 && (hora > 12 || (hora === 12 && minutos >= 30));
    }

    const agora = new Date();
    const diaSemana = agora.getDay();
    const hora = agora.getHours();
    const minutos = agora.getMinutes();
    
    // Usar configurações dinâmicas
    const [horaConfig, minutoConfig] = configuracoes.horario_liberacao.split(':').map(Number);
    const diaConfig = configuracoes.dia_liberacao;
    
    return diaSemana === diaConfig && (hora > horaConfig || (hora === horaConfig && minutos >= minutoConfig));
  };

  const getDiaSemanaTexto = (dia: number) => {
    return diasSemana[dia] || 'segunda-feira';
  };

  const handleInscricao = async (aulaId: string) => {
    if (!user || !userData) return;

    // Verificação de segurança
    if (!isSecure) {
      toast.error('⚠️ Ação bloqueada por violação de segurança. Recarregue a página e evite manipular o sistema.');
      return;
    }

    if (isAlunoSuspenso()) {
      toast.error('Você está suspenso e não pode se inscrever em aulas');
      return;
    }

    setLoading(true);
    try {
      const aula = aulas.find(a => a.id === aulaId);
      if (!aula) throw new Error('Aula não encontrada');

      // Determinar status usando a função do banco
      const { data: statusData, error: statusError } = await supabase
        .rpc('determinar_status_inscricao', {
          aula_uuid: aulaId
        });

      if (statusError) throw statusError;

      const status = statusData as 'confirmado' | 'espera';
      const timestamp = new Date();

      // Atualizar UI imediatamente (otimistic update)
      const novaInscricao = {
        id: 'temp-' + Date.now(),
        status: status
      };

      setAulas(prevAulas => 
        prevAulas.map(a => 
          a.id === aulaId 
            ? { 
                ...a, 
                minha_inscricao: novaInscricao,
                inscricoes_count: status === 'confirmado' ? a.inscricoes_count + 1 : a.inscricoes_count
              }
            : a
        )
      );

      // Inserir no banco de dados
      const { error, data } = await supabase
        .from('inscricoes')
        .insert({
          aula_id: aulaId,
          aluno_id: user.id,
          status: status,
          timestamp_inscricao: timestamp.toISOString()
        })
        .select('id, status')
        .single();

      if (error) throw error;

      toast.success(
        status === 'confirmado' 
          ? 'Inscrição confirmada!' 
          : 'Você foi adicionado à lista de espera!'
      );

      // Atualizar com dados reais do banco
      setAulas(prevAulas => 
        prevAulas.map(a => 
          a.id === aulaId 
            ? { 
                ...a, 
                minha_inscricao: {
                  id: data.id,
                  status: data.status as 'confirmado' | 'espera'
                }
              }
            : a
        )
      );

    } catch (error: any) {
      console.error('Erro na inscrição:', error);
      
      // Reverter UI em caso de erro
      setAulas(prevAulas => 
        prevAulas.map(a => 
          a.id === aulaId 
            ? { 
                ...a, 
                minha_inscricao: undefined,
                inscricoes_count: a.inscricoes_count
              }
            : a
        )
      );
      
      if (error.code === '23505') { // Unique constraint violation
        toast.error('Você já está inscrito nesta aula');
      } else if (error.message?.includes('já possui inscrição em aula nesta semana')) {
        toast.error('Você já possui uma inscrição nesta semana. Apenas uma inscrição por semana é permitida.');
      } else {
        toast.error('Erro ao fazer inscrição. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarInscricao = async (aulaId: string) => {
    if (!user || !userData) return;

    setLoading(true);
    try {
      const aula = aulas.find(a => a.id === aulaId);
      if (!aula?.minha_inscricao) return;

      const agora = new Date();
      const dataAula = new Date();
      // Assumindo que a aula é hoje para este exemplo - em produção você teria a data específica
      const diferencaHoras = (dataAula.getTime() - agora.getTime()) / (1000 * 60 * 60);

      let motivo = 'cancelamento_4h';
      if (diferencaHoras < 4) {
        motivo = 'cancelamento_menos_4h';
        
        // Aplicar suspensão de 1 semana
        const { error: suspensaoError } = await supabase.rpc('aplicar_suspensao', {
          aluno_uuid: user.id,
          motivo_param: motivo,
          semanas_param: 1
        });

        if (suspensaoError) throw suspensaoError;
      }

      // Marcar cancelamento
      const { error } = await supabase
        .from('inscricoes')
        .update({
          cancelamento: agora.toISOString(),
          motivo_cancelamento: motivo,
          atualizado_em: agora.toISOString()
        })
        .eq('id', aula.minha_inscricao.id);

      if (error) throw error;

      // Promover aluno da lista de espera se necessário
      if (aula.minha_inscricao.status === 'confirmado') {
        const { error: promoverError } = await supabase.rpc('promover_lista_espera', {
          aula_uuid: aulaId
        });

        if (promoverError) {
          console.error('Erro ao promover lista de espera:', promoverError);
        }
      }

      toast.success(
        diferencaHoras < 4 
          ? 'Inscrição cancelada. Você foi suspenso por 1 semana por cancelar com menos de 4h de antecedência.' 
          : 'Inscrição cancelada com sucesso!'
      );

      await fetchAulas();
    } catch (error) {
      console.error('Erro ao cancelar inscrição:', error);
      toast.error('Erro ao cancelar inscrição. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInscricao = (aula: Aula) => {
    if (!aula.minha_inscricao) return null;
    
    if (aula.minha_inscricao.status === 'confirmado') {
      return <Badge className="bg-green-500 text-white">Confirmado</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">
        Lista de espera
      </Badge>;
    }
  };

  const podeVerLink = (aula: Aula) => {
    return aula.minha_inscricao?.status === 'confirmado';
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-black mb-2">Carregando dados do usuário...</h2>
          <p className="text-black/60">Aguarde enquanto buscamos suas informações.</p>
        </div>
      </div>
    );
  }

  if (userData.role !== 'aluno') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-black mb-2">Acesso negado</h2>
          <p className="text-black/60">Esta área é restrita para alunos.</p>
        </div>
      </div>
    );
  }

  const inscricaoAberta = isInscricaoAberta();

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Logo size="md" />
            <div>
              <h1 className="text-3xl font-bold text-black">Dashboard do Aluno</h1>
              <p className="text-black/70">Bem-vindo, {userData.nome}!</p>
            </div>
          </div>
          <Button 
            onClick={logout} 
            variant="outline"
            className="border-black/30 text-black hover:bg-yellow-200"
          >
            Sair
          </Button>
        </div>

        {/* Alertas de Segurança */}
        {!isSecure && securityAlerts.length > 0 && (
          <div className="mb-6 space-y-4" data-security-critical>
            {securityAlerts.map((alert, index) => (
              <Alert key={index} className="border-red-500 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  {alert.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}


        {/* Comunicado sobre período de inscrições */}
        <Card className="mb-6 border-blue-500 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-blue-800">
              <strong>Período de inscrições:</strong>{' '}
              {configuracoes?.mensagem_periodo_inscricao || 
                `As inscrições abrem toda ${getDiaSemanaTexto(configuracoes?.dia_liberacao || 1)} às ${configuracoes?.horario_liberacao || '12:30'}.`
              }
              <p className="text-sm mt-1">
                Você poderá se inscrever nas aulas disponíveis apenas durante este horário.
              </p>
              <p className="text-sm mt-2 font-medium">
                <strong>Regras:</strong> Apenas uma inscrição por semana é permitida.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Período de inscrições e aulas disponíveis */}
        {!inscricaoAberta && aulas.length > 0 && !aulas.some(aula => aula.inscricoes_abertas) && (
          <Card className="mb-6 border-orange-500 bg-orange-50">
            <CardContent className="pt-6">
              <div className="text-orange-800">
                <strong>Inscrições fechadas:</strong> As inscrições estão fechadas no momento.
                <p className="text-sm mt-1">
                  Aguarde até {getDiaSemanaTexto(configuracoes?.dia_liberacao || 1)} às {configuracoes?.horario_liberacao || '12:30'} para se inscrever nas aulas.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verificar se há avisos de falta pendentes */}
        <VerificarAvisosPendentes />

        {isAlunoSuspenso() && userData.fimSuspensao && (
          <Card className="mb-6 border-red-500 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-red-800">
                <strong>Você está suspenso até:</strong>{' '}
                {userData.fimSuspensao.toLocaleDateString('pt-BR')}
                <p className="text-sm mt-1">
                  Durante o período de suspensão, você não pode se inscrever em novas aulas.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black">Aulas Disponíveis</h2>
          
          {aulas.length === 0 && (
            <Card className="border-black/20">
              <CardContent className="pt-6 text-center">
                <p className="text-black/60">Nenhuma aula disponível no momento.</p>
              </CardContent>
            </Card>
          )}

          {aulas.map((aula) => {
            const vagasRestantes = aula.capacidade - aula.inscricoes_count;
            const suspenso = isAlunoSuspenso();
            const jaInscrito = !!aula.minha_inscricao;
            const podeSeInscrever = (inscricaoAberta || aula.inscricoes_abertas) && !suspenso && !jaInscrito;
            
            return (
              <Card key={aula.id} className="border-black/20 shadow-md">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-black">
                        {diasSemana[aula.dia_semana]} - {aula.horario}
                      </CardTitle>
                      <p className="text-sm text-black/60 mt-1">
                        Professor: {aula.professor_nome}
                      </p>
                      <p className="text-sm text-black/60">
                        Nível: {aula.nivel}
                      </p>
                      {podeVerLink(aula) && (
                        <p className="text-sm text-black/60">
                          Link: <a 
                            href={aula.link_meet} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-yellow-600 hover:underline"
                          >
                            {aula.link_meet}
                          </a>
                        </p>
                      )}
                      {!podeVerLink(aula) && aula.minha_inscricao && (
                        <p className="text-sm text-orange-600">
                          Link disponível apenas para alunos confirmados
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge 
                        variant={vagasRestantes > 0 ? "default" : "secondary"}
                        className={vagasRestantes > 0 ? "bg-yellow-500 text-black" : "bg-black/10 text-black"}
                      >
                        {vagasRestantes > 0 ? `${vagasRestantes} vagas` : 'Lotado'}
                      </Badge>
                      {getStatusInscricao(aula)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {jaInscrito ? (
                      <>
                        {aula.minha_inscricao?.status === 'confirmado' && (
                          <AvisarFaltaModal
                            aulaId={aula.id}
                            alunoId={user?.id || ''}
                            diaSemana={diasSemana[aula.dia_semana]}
                            horario={aula.horario}
                          />
                        )}
                      </>
                    ) : suspenso ? (
                      <Badge variant="destructive">Suspenso</Badge>
                    ) : !inscricaoAberta ? (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Inscrições fechadas
                      </Badge>
                    ) : (
                      <SecurityWrapper onTamperDetected={() => toast.error('🚨 Manipulação detectada! Sistema bloqueado.')}>
                        <Button 
                          onClick={() => handleInscricao(aula.id)}
                          disabled={loading || !podeSeInscrever || !isSecure}
                          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold disabled:opacity-50"
                          data-security-critical
                        >
                          {!isSecure ? '🔒 Bloqueado' : vagasRestantes > 0 ? 'Inscrever-me' : 'Entrar na Lista de Espera'}
                        </Button>
                      </SecurityWrapper>
                    )}
                  </div>
                  
                  {/* Mostrar detalhes das inscrições sempre */}
                  <InscricoesDetalhes
                    aulaId={aula.id}
                    diaSemana={diasSemana[aula.dia_semana]}
                    horario={aula.horario}
                    minhaInscricao={aula.minha_inscricao}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Regras de suspensão */}
        <Card className="mb-6 border-orange-500 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">⚠️ Regras de Suspensão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-orange-800 space-y-2">
              <p><strong>Falta com aviso ≥ 4h antes da aula:</strong> 2 semanas de suspensão</p>
              <p><strong>Falta com aviso &lt; 4h antes da aula:</strong> 3 semanas de suspensão</p>
              <p><strong>Falta sem aviso:</strong> 4 semanas de suspensão</p>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas de presença */}
        <div className="mb-6">
          <EstatisticasPresencaAluno alunoId={user?.id || ''} />
        </div>
      </div>
    </div>
  );
};

export default DashboardAluno;
