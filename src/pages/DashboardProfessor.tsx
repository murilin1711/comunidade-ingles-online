
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where, getDocs } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Aula {
  id: string;
  data: any;
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
  timestamp: any;
  nomeAluno?: string;
}

const DashboardProfessor = () => {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [aulaSelecionada, setAulaSelecionada] = useState<string>('');
  const [confirmados, setConfirmados] = useState<Inscricao[]>([]);
  const [listaEspera, setListaEspera] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Escutar aulas em tempo real
    const q = query(collection(db, 'aulas'), orderBy('data', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const aulasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Aula));
      setAulas(aulasData);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!aulaSelecionada) return;

    const fetchInscricoes = async () => {
      try {
        // Buscar confirmados
        const qConfirmados = query(
          collection(db, 'inscricoes'),
          where('aulaId', '==', aulaSelecionada),
          where('status', '==', 'confirmado')
        );
        const confirmadosSnapshot = await getDocs(qConfirmados);
        
        // Buscar lista de espera
        const qEspera = query(
          collection(db, 'inscricoes'),
          where('aulaId', '==', aulaSelecionada),
          where('status', '==', 'espera'),
          orderBy('timestamp', 'asc')
        );
        const esperaSnapshot = await getDocs(qEspera);

        // Buscar nomes dos alunos
        const processInscricoes = async (snapshot: any) => {
          const inscricoes = await Promise.all(
            snapshot.docs.map(async (doc: any) => {
              const inscricaoData = { id: doc.id, ...doc.data() };
              
              // Buscar nome do aluno
              const alunoDoc = await getDocs(
                query(collection(db, 'alunos'), where('matricula', '==', inscricaoData.matricula))
              );
              
              if (!alunoDoc.empty) {
                inscricaoData.nomeAluno = alunoDoc.docs[0].data().nome;
              }
              
              return inscricaoData;
            })
          );
          return inscricoes;
        };

        const confirmadosData = await processInscricoes(confirmadosSnapshot);
        const esperaData = await processInscricoes(esperaSnapshot);

        setConfirmados(confirmadosData);
        setListaEspera(esperaData);
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
      const response = await fetch('https://your-region-your-project.cloudfunctions.net/marcarPresenca', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({ inscricaoId })
      });

      if (response.ok) {
        toast.success('Presença marcada!');
        // Atualizar lista localmente
        setConfirmados(prev => 
          prev.map(item => 
            item.id === inscricaoId ? { ...item, presenca: true } : item
          )
        );
      }
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
      const response = await fetch('https://your-region-your-project.cloudfunctions.net/marcarFalta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({ 
          matricula, 
          aulaId: aulaSelecionada, 
          tipo 
        })
      });

      if (response.ok) {
        toast.success('Ação processada com sucesso!');
        // Recarregar inscrições
        window.location.reload();
      }
    } catch (error) {
      console.error('Erro ao processar falta:', error);
      toast.error('Erro ao processar ação');
    } finally {
      setLoading(false);
    }
  };

  const aulaSelecionadaData = aulas.find(a => a.id === aulaSelecionada);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard do Professor</h1>
          <Button onClick={logout} variant="outline">
            Sair
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Selecionar Aula</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={aulaSelecionada} onValueChange={setAulaSelecionada}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma aula" />
              </SelectTrigger>
              <SelectContent>
                {aulas.map((aula) => (
                  <SelectItem key={aula.id} value={aula.id}>
                    {format(aula.data.toDate(), 'dd/MM/yyyy', { locale: ptBR })} - {aula.horario}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {aulaSelecionada && aulaSelecionadaData && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Confirmados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Confirmados
                  <Badge>{confirmados.length}/6</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {confirmados.map((inscricao) => (
                  <div key={inscricao.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{inscricao.nomeAluno || 'Nome não encontrado'}</p>
                        <p className="text-sm text-gray-600">Matrícula: {inscricao.matricula}</p>
                      </div>
                      {inscricao.presenca && (
                        <Badge variant="default">Presente</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!inscricao.presenca && (
                        <Button
                          size="sm"
                          onClick={() => handleMarcarPresenca(inscricao.id)}
                          disabled={loading}
                        >
                          Presença
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarcarFalta(inscricao.matricula, 'cancel≥4h')}
                        disabled={loading}
                      >
                        Cancel ≥4h
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarcarFalta(inscricao.matricula, 'cancel<4h')}
                        disabled={loading}
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
                  <p className="text-gray-500 text-center">Nenhum aluno confirmado</p>
                )}
              </CardContent>
            </Card>

            {/* Lista de Espera */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Lista de Espera
                  <Badge variant="secondary">{listaEspera.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {listaEspera.map((inscricao, index) => (
                  <div key={inscricao.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{inscricao.nomeAluno || 'Nome não encontrado'}</p>
                        <p className="text-sm text-gray-600">Posição: {index + 1}</p>
                        <p className="text-xs text-gray-500">
                          {inscricao.timestamp && format(inscricao.timestamp.toDate(), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {listaEspera.length === 0 && (
                  <p className="text-gray-500 text-center">Lista de espera vazia</p>
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
