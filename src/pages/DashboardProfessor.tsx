
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Logo from '@/components/Logo';

interface Aula {
  id: string;
  data: Date;
  horario: string;
  linkMeet: string;
  capacidade: number;
}

interface Inscricao {
  id: string;
  matricula: string;
  aulaId: string;
  status: string;
  presenca: boolean;
  timestamp: Date;
  nomeAluno?: string;
}

const DashboardProfessor = () => {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [aulaSelecionada, setAulaSelecionada] = useState<string>('');
  const [confirmados, setConfirmados] = useState<Inscricao[]>([]);
  const [listaEspera, setListaEspera] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, userData, logout } = useAuth();

  useEffect(() => {
    if (!user || !userData) return;

    // Por enquanto, vamos usar dados mockados até implementarmos as aulas no Supabase
    const aulasMockadas: Aula[] = [
      {
        id: '1',
        data: new Date('2025-06-10T10:00:00'),
        horario: '10:00 - 11:00',
        linkMeet: 'https://meet.google.com/abc-def-ghi',
        capacidade: 6
      },
      {
        id: '2',
        data: new Date('2025-06-12T14:00:00'),
        horario: '14:00 - 15:00',
        linkMeet: 'https://meet.google.com/jkl-mno-pqr',
        capacidade: 6
      }
    ];
    
    setAulas(aulasMockadas);
  }, [user, userData]);

  useEffect(() => {
    if (!aulaSelecionada) return;

    const fetchInscricoes = async () => {
      try {
        // Dados mockados para teste - substituir por queries Supabase futuramente
        const confirmadosMockados: Inscricao[] = [
          {
            id: '1',
            matricula: '2024001',
            aulaId: aulaSelecionada,
            status: 'confirmado',
            presenca: false,
            timestamp: new Date(),
            nomeAluno: 'João Silva'
          }
        ];

        const esperaMockados: Inscricao[] = [
          {
            id: '2',
            matricula: '2024002',
            aulaId: aulaSelecionada,
            status: 'espera',
            presenca: false,
            timestamp: new Date(),
            nomeAluno: 'Maria Santos'
          }
        ];

        setConfirmados(confirmadosMockados);
        setListaEspera(esperaMockados);
      } catch (error) {
        console.error('Erro ao buscar inscrições:', error);
        toast.error('Erro ao carregar inscrições');
      }
    };

    fetchInscricoes();
  }, [aulaSelecionada]);

  const handleMarcarPresenca = async (inscricaoId: string) => {
    setLoading(true);
    try {
      // Implementar com Supabase futuramente
      console.log('Marcando presença para:', inscricaoId);
      
      toast.success('Presença marcada!');
      // Atualizar lista localmente
      setConfirmados(prev => 
        prev.map(item => 
          item.id === inscricaoId ? { ...item, presenca: true } : item
        )
      );
    } catch (error) {
      console.error('Erro ao marcar presença:', error);
      toast.error('Erro ao marcar presença');
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarFalta = async (matricula: string, tipo: string) => {
    setLoading(true);
    try {
      // Implementar com Supabase futuramente
      console.log('Marcando falta:', { matricula, aulaId: aulaSelecionada, tipo });
      
      toast.success('Ação processada com sucesso!');
      // Recarregar inscrições
      window.location.reload();
    } catch (error) {
      console.error('Erro ao processar falta:', error);
      toast.error('Erro ao processar ação');
    } finally {
      setLoading(false);
    }
  };

  const aulaSelecionadaData = aulas.find(a => a.id === aulaSelecionada);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Logo size="md" />
            <div>
              <h1 className="text-3xl font-bold text-black">Dashboard do Professor</h1>
              {userData && (
                <p className="text-black/70">Bem-vindo, {userData.nome}!</p>
              )}
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
              <SelectTrigger className="w-full border-black/20">
                <SelectValue placeholder="Selecione uma aula" />
              </SelectTrigger>
              <SelectContent>
                {aulas.map((aula) => (
                  <SelectItem key={aula.id} value={aula.id}>
                    {format(aula.data, 'dd/MM/yyyy', { locale: ptBR })} - {aula.horario}
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
                  <Badge className="bg-yellow-500 text-black">{confirmados.length}/6</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {confirmados.map((inscricao) => (
                  <div key={inscricao.id} className="border border-black/20 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-black">{inscricao.nomeAluno || 'Nome não encontrado'}</p>
                        <p className="text-sm text-black/60">Matrícula: {inscricao.matricula}</p>
                      </div>
                      {inscricao.presenca && (
                        <Badge className="bg-yellow-500 text-black">Presente</Badge>
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
                        onClick={() => handleMarcarFalta(inscricao.matricula, 'cancel≥4h')}
                        disabled={loading}
                        className="border-black/30 text-black hover:bg-yellow-50"
                      >
                        Cancel ≥4h
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarcarFalta(inscricao.matricula, 'cancel<4h')}
                        disabled={loading}
                        className="border-black/30 text-black hover:bg-yellow-50"
                      >
                        Cancel &lt;4h
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleMarcarFalta(inscricao.matricula, 'falta')}
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
                        <p className="font-medium text-black">{inscricao.nomeAluno || 'Nome não encontrado'}</p>
                        <p className="text-sm text-black/60">Posição: {index + 1}</p>
                        <p className="text-xs text-black/50">
                          {format(inscricao.timestamp, 'dd/MM/yyyy HH:mm')}
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
