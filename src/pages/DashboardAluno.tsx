
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import Logo from '@/components/Logo';

interface Aula {
  id: string;
  data: string;
  horario: string;
  linkMeet: string;
  capacidade: number;
}

const DashboardAluno = () => {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, userData, logout } = useAuth();

  useEffect(() => {
    if (user && userData) {
      console.log('User authenticated:', user.id, userData);
      // TODO: Fetch aulas from Supabase when aulas table is created
      // For now, we'll use empty array
      setAulas([]);
    }
  }, [user, userData]);

  const isAlunoSuspenso = () => {
    if (!userData || userData.role !== 'aluno') return false;
    if (!userData.statusSuspenso) return false;
    
    if (userData.fimSuspensao) {
      const agora = new Date();
      return userData.fimSuspensao > agora;
    }
    
    return false;
  };

  const handleInscricao = async (aulaId: string, tipoInscricao: 'confirmado' | 'espera') => {
    if (!user || !userData) return;

    setLoading(true);
    try {
      console.log('Attempting to register for aula:', aulaId, tipoInscricao);
      
      // TODO: Implement actual inscription logic when aulas table and cloud functions are ready
      toast.success(
        tipoInscricao === 'confirmado' 
          ? 'Inscrição confirmada!' 
          : 'Você foi adicionado à lista de espera!'
      );
    } catch (error) {
      console.error('Erro na inscrição:', error);
      toast.error('Erro ao fazer inscrição. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getVagasRestantes = (aula: Aula) => {
    // TODO: Calculate actual remaining spots when inscription system is implemented
    return aula.capacidade;
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

        {isAlunoSuspenso() && userData.fimSuspensao && (
          <Card className="mb-6 border-red-500 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-red-800">
                <strong>Você está suspenso até:</strong>{' '}
                {userData.fimSuspensao.toLocaleDateString('pt-BR')}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          <h2 className="text-xl font-semibold mb-4 text-black">Aulas Disponíveis</h2>
          
          {aulas.length === 0 && (
            <Card className="border-black/20">
              <CardContent className="pt-6 text-center">
                <p className="text-black/60">Nenhuma aula disponível no momento.</p>
                <p className="text-black/40 text-sm mt-2">
                  O sistema de aulas será implementado em breve.
                </p>
              </CardContent>
            </Card>
          )}

          {aulas.map((aula) => {
            const vagasRestantes = getVagasRestantes(aula);
            const suspenso = isAlunoSuspenso();
            
            return (
              <Card key={aula.id} className="border-black/20 shadow-md">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg text-black">
                        {new Date(aula.data).toLocaleDateString('pt-BR')} - {aula.horario}
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
        </div>
      </div>
    </div>
  );
};

export default DashboardAluno;
