
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const DashboardAluno = () => {
  const [aulas, setAulas] = useState<Aula[]>([]);
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

  const isAlunoSuspenso = () => {
    if (!userData) return false;
    return userData.statusSuspenso || false;
  };

  const handleInscricao = async (aulaId: string, tipoInscricao: 'confirmado' | 'espera') => {
    if (!user || !userData) return;

    setLoading(true);
    try {
      // Aqui implementaremos a lógica de inscrição no Supabase futuramente
      console.log('Inscrição solicitada:', { aulaId, tipoInscricao, usuario: userData.matricula });
      
      if (tipoInscricao === 'confirmado') {
        toast.success('Inscrição confirmada!');
      } else if (tipoInscricao === 'espera') {
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
    // Por enquanto retorna capacidade total, será calculado via query futuramente
    return aula.capacidade;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Logo size="md" />
            <div>
              <h1 className="text-3xl font-bold text-black">Dashboard do Aluno</h1>
              {userData && (
                <p className="text-black/70">Bem-vindo, {userData.nome}!</p>
              )}
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

        {isAlunoSuspenso() && (
          <Card className="mb-6 border-red-500 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-red-800">
                <strong>Você está suspenso</strong>
                {userData?.fimSuspensao && (
                  <span> até: {format(userData.fimSuspensao, 'dd/MM/yyyy', { locale: ptBR })}</span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          <h2 className="text-xl font-semibold mb-4 text-black">Aulas Disponíveis</h2>
          
          {aulas.map((aula) => {
            const vagasRestantes = getVagasRestantes(aula);
            const suspenso = isAlunoSuspenso();
            
            return (
              <Card key={aula.id} className="border-black/20 shadow-md">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-black">
                        {format(aula.data, 'dd/MM/yyyy', { locale: ptBR })} - {aula.horario}
                      </CardTitle>
                      <p className="text-sm text-black/60 mt-1">
                        Link: <a href={aula.linkMeet} target="_blank" rel="noopener noreferrer" className="text-yellow-600 hover:underline">
                          {aula.linkMeet}
                        </a>
                      </p>
                    </div>
                    <Badge 
                      variant={vagasRestantes > 0 ? "default" : "secondary"}
                      className={vagasRestantes > 0 ? "bg-yellow-500 text-black" : "bg-black/10 text-black"}
                    >
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
                        className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                      >
                        Inscrever-me
                      </Button>
                    ) : (
                      <Button 
                        variant="outline"
                        onClick={() => handleInscricao(aula.id, 'espera')}
                        disabled={loading}
                        className="border-black/30 text-black hover:bg-yellow-50"
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
            <Card className="border-black/20">
              <CardContent className="pt-6 text-center">
                <p className="text-black/60">Nenhuma aula disponível no momento.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardAluno;
