import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut, BarChart3, Users, Settings } from 'lucide-react';
import EstatisticasAulas from '@/components/admin/EstatisticasAulas';
import EstatisticasProfessores from '@/components/admin/EstatisticasProfessores';
import ConfiguracoesSistema from '@/components/admin/ConfiguracoesSistema';

const DashboardAdmin = () => {
  const { user, userData, logout } = useAuth();

  if (!userData || (userData.role as string) !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-black mb-2">Acesso negado</h2>
          <p className="text-black/60">Esta área é restrita para administradores.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Card className="border-black/20">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl text-black">
                    Dashboard Administrativo
                  </CardTitle>
                  <p className="text-black/60 mt-1">
                    Bem-vindo, {userData.nome}
                  </p>
                </div>
                <Button
                  onClick={logout}
                  variant="outline"
                  className="border-black/30 text-black hover:bg-yellow-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="aulas" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/50 border border-black/20">
            <TabsTrigger value="aulas" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Histórico de Aulas
            </TabsTrigger>
            <TabsTrigger value="professores" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Desempenho dos Professores
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Regras de Suspensão
            </TabsTrigger>
          </TabsList>

          <TabsContent value="aulas">
            <EstatisticasAulas />
          </TabsContent>

          <TabsContent value="professores">
            <EstatisticasProfessores />
          </TabsContent>

          <TabsContent value="configuracoes">
            <ConfiguracoesSistema />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardAdmin;