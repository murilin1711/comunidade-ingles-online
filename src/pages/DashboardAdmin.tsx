import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, BarChart3, Users, Settings } from 'lucide-react';
import EstatisticasAulas from '@/components/admin/EstatisticasAulas';
import EstatisticasProfessores from '@/components/admin/EstatisticasProfessores';
import GerenciarSuspensoes from '@/components/admin/GerenciarSuspensoes';
import GerenciarAulasAdmin from '@/components/admin/GerenciarAulasAdmin';

const DashboardAdmin = () => {
  const { user, userData, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('historico');
  const [refreshKey, setRefreshKey] = useState(0);

  // Force refresh when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setRefreshKey(prev => prev + 1);
  };

  // Real-time updates to trigger refreshes
  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'aulas'
        },
        () => {
          setRefreshKey(prev => prev + 1);
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
          setRefreshKey(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/50 border border-black/20">
            <TabsTrigger value="historico" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Histórico de Aulas
            </TabsTrigger>
            <TabsTrigger value="professores" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Desempenho dos Professores
            </TabsTrigger>
            <TabsTrigger value="suspensoes" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Suspensões
            </TabsTrigger>
            <TabsTrigger value="aulas" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Aulas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="historico">
            <EstatisticasAulas key={`historico-${refreshKey}`} />
          </TabsContent>

          <TabsContent value="professores">
            <EstatisticasProfessores key={`professores-${refreshKey}`} />
          </TabsContent>

          <TabsContent value="suspensoes">
            <GerenciarSuspensoes key={`suspensoes-${refreshKey}`} />
          </TabsContent>

          <TabsContent value="aulas">
            <GerenciarAulasAdmin key={`aulas-${refreshKey}`} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardAdmin;