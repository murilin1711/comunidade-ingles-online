
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, BarChart3, Users, Settings, Menu } from 'lucide-react';
import EstatisticasAulas from '@/components/admin/EstatisticasAulas';
import EstatisticasProfessores from '@/components/admin/EstatisticasProfessores';
import GerenciarSuspensoes from '@/components/admin/GerenciarSuspensoes';
import GerenciarAulasAdmin from '@/components/admin/GerenciarAulasAdmin';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const DashboardAdmin = () => {
  const { user, userData, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('historico');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Force refresh when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setRefreshKey(prev => prev + 1);
    setIsMenuOpen(false); // Fechar menu mobile ao selecionar tab
  };

  // Real-time updates para sincronização automática
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
          console.log('Admin: Aulas changed, triggering refresh...');
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
          console.log('Admin: Inscricoes changed, triggering refresh...');
          setRefreshKey(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'avisos_falta'
        },
        () => {
          console.log('Admin: Avisos falta changed, triggering refresh...');
          setRefreshKey(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'suspensoes'
        },
        () => {
          console.log('Admin: Suspensoes changed, triggering refresh...');
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
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-black mb-2">Acesso negado</h2>
          <p className="text-black/60">Esta área é restrita para administradores.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { value: 'historico', label: 'Histórico', icon: BarChart3 },
    { value: 'professores', label: 'Professores', icon: Users },
    { value: 'suspensoes', label: 'Suspensões', icon: Settings },
    { value: 'aulas', label: 'Aulas', icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Mobile e Desktop */}
        <div className="mb-4 sm:mb-6">
          <Card className="border-black/20">
            <CardHeader className="pb-3 sm:pb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg sm:text-2xl text-black truncate">
                    Dashboard Administrativo
                  </CardTitle>
                  <p className="text-black/60 mt-1 text-sm sm:text-base truncate">
                    Bem-vindo, {userData.nome}
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  {/* Menu Mobile */}
                  <div className="block sm:hidden">
                    <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                      <SheetTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-black/30 text-black hover:bg-yellow-50"
                        >
                          <Menu className="w-4 h-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="bottom" className="h-[300px] bg-white">
                        <div className="py-4">
                          <h3 className="font-semibold text-black mb-4">Navegação</h3>
                          <div className="grid grid-cols-2 gap-3">
                            {tabs.map((tab) => (
                              <Button
                                key={tab.value}
                                variant={activeTab === tab.value ? "default" : "outline"}
                                onClick={() => handleTabChange(tab.value)}
                                className="h-12 flex flex-col items-center gap-1 text-xs"
                              >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>

                  <Button
                    onClick={logout}
                    variant="outline"
                    size="sm"
                    className="border-black/30 text-black hover:bg-yellow-50"
                  >
                    <LogOut className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Sair</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs Content */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 sm:space-y-6">
          {/* Desktop Tabs List */}
          <TabsList className="hidden sm:grid w-full grid-cols-4 bg-white/50 border border-black/20">
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

          {/* Mobile Tab Indicator */}
          <div className="block sm:hidden">
            <Card className="border-black/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  {tabs.find(tab => tab.value === activeTab) && (
                    <>
                      {React.createElement(tabs.find(tab => tab.value === activeTab)!.icon, { 
                        className: "w-4 h-4 text-black" 
                      })}
                      <span className="font-medium text-black">
                        {tabs.find(tab => tab.value === activeTab)!.label}
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

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
