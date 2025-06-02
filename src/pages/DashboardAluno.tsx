
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface AlunoData {
  statusSuspenso: boolean;
  fimSuspensao: any;
  nome: string;
}

const DashboardAluno = () => {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [alunoData, setAlunoData] = useState<AlunoData | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Buscar dados do aluno
    const fetchAlunoData = async () => {
      const alunoDoc = await getDoc(doc(db, 'alunos', user.uid));
      if (alunoDoc.exists()) {
        setAlunoData(alunoDoc.data() as AlunoData);
      }
    };

    fetchAlunoData();

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

  const isAlunoSuspenso = () => {
    if (!alunoData) return false;
    if (!alunoData.statusSuspenso) return false;
    
    if (alunoData.fimSuspensao) {
      const agora = new Date();
      const fimSuspensao = alunoData.fimSuspensao.toDate();
      return fimSuspensao > agora;
    }
    
    return false;
  };

  const handleInscricao = async (aulaId: string, tipoInscricao: 'confirmado' | 'espera') => {
    if (!user || !alunoData) return;

    setLoading(true);
    try {
      // Aqui seria chamada a Cloud Function
      const response = await fetch('https://your-region-your-project.cloudfunctions.net/inscrever', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          matricula: user.uid,
          aulaId: aulaId
        })
      });

      const result = await response.json();
      
      if (result.status === 'confirmado') {
        toast.success('Inscrição confirmada!');
      } else if (result.status === 'espera') {
        toast.success('Você foi adicionado à lista de espera!');
      }
    } catch (error) {
      console.error('Erro na inscrição:', error);
      toast.error('Erro ao fazer inscrição. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getVagasRestantes = (aula: Aula) => {
    // Por enquanto retorna capacidade total, seria calculado via query
    return aula.capacidade;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard do Aluno</h1>
            {alunoData && (
              <p className="text-gray-600">Bem-vindo, {alunoData.nome}!</p>
            )}
          </div>
          <Button onClick={logout} variant="outline">
            Sair
          </Button>
        </div>

        {isAlunoSuspenso() && alunoData?.fimSuspensao && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-red-800">
                <strong>Você está suspenso até:</strong>{' '}
                {format(alunoData.fimSuspensao.toDate(), 'dd/MM/yyyy', { locale: ptBR })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          <h2 className="text-xl font-semibold mb-4">Aulas Disponíveis</h2>
          
          {aulas.map((aula) => {
            const vagasRestantes = getVagasRestantes(aula);
            const dataAula = aula.data.toDate();
            const suspenso = isAlunoSuspenso();
            
            return (
              <Card key={aula.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {format(dataAula, 'dd/MM/yyyy', { locale: ptBR })} - {aula.horario}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Link: <a href={aula.linkMeet} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {aula.linkMeet}
                        </a>
                      </p>
                    </div>
                    <Badge variant={vagasRestantes > 0 ? "default" : "secondary"}>
                      {vagasRestantes > 0 ? `${vagasRestantes} vagas` : 'Lotado'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {suspenso ? (
                      <Badge variant="destructive">Suspenso</Badge>
                    ) : vagasRestantes > 0 ? (
                      <Button 
                        onClick={() => handleInscricao(aula.id, 'confirmado')}
                        disabled={loading}
                      >
                        Inscrever-me
                      </Button>
                    ) : (
                      <Button 
                        variant="outline"
                        onClick={() => handleInscricao(aula.id, 'espera')}
                        disabled={loading}
                      >
                        Entrar na Lista de Espera
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {aulas.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-gray-500">Nenhuma aula disponível no momento.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardAluno;
