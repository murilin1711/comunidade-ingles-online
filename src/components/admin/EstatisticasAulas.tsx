
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAdminStats } from '@/hooks/admin/useAdminStats';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Users, UserCheck, UserX, UserMinus, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import HistoricoAulaCard from './HistoricoAulaCard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const EstatisticasAulas = () => {
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    professor: 'todos',
    nivel: 'todos'
  });
  
  const [ordenacao, setOrdenacao] = useState<'recente' | 'antiga'>('recente');
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const { 
    historicoAulas, 
    professores,
    estatisticasPresenca, 
    loading, 
    fetchHistoricoAulas,
    fetchProfessores
  } = useAdminStats();

  useEffect(() => {
    fetchProfessores();
  }, [fetchProfessores]);

  useEffect(() => {
    fetchHistoricoAulas(filtros);
  }, [filtros, fetchHistoricoAulas]);

  // Real-time updates for admin dashboard
  useEffect(() => {
    const channel = supabase
      .channel('admin-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'aulas'
        },
        () => {
          fetchHistoricoAulas(filtros);
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
          fetchHistoricoAulas(filtros);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filtros, fetchHistoricoAulas]);

  const aulasOrdenadas = [...historicoAulas].sort((a, b) => {
    const dataA = a.data_aula ? new Date(a.data_aula) : new Date(0);
    const dataB = b.data_aula ? new Date(b.data_aula) : new Date(0);
    return ordenacao === 'recente' ? dataB.getTime() - dataA.getTime() : dataA.getTime() - dataB.getTime();
  });

  const diasSemana = [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filtros - Mobile Collapsible */}
      <Card className="border-black/20">
        <Collapsible open={filtrosAbertos} onOpenChange={setFiltrosAbertos}>
          <CardHeader className="pb-3 sm:pb-6">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <CardTitle className="text-black flex items-center gap-2">
                  <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Filtros</span>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-black/60 hidden sm:inline">
                    {filtrosAbertos ? 'Fechar' : 'Abrir'}
                  </span>
                  <Calendar className={cn(
                    "w-4 h-4 transition-transform",
                    filtrosAbertos && "rotate-180"
                  )} />
                </div>
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="text-sm font-medium text-black mb-2 block">
                    Data Início
                  </label>
                  <Input
                    type="date"
                    value={filtros.dataInicio}
                    onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
                    className="border-black/30 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-black mb-2 block">
                    Data Fim
                  </label>
                  <Input
                    type="date"
                    value={filtros.dataFim}
                    onChange={(e) => setFiltros({...filtros, dataFim: e.target.value})}
                    className="border-black/30 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-black mb-2 block">
                    Professor
                  </label>
                  <Select 
                    value={filtros.professor} 
                    onValueChange={(value) => setFiltros({...filtros, professor: value})}
                  >
                    <SelectTrigger className="border-black/30 text-sm">
                      <SelectValue placeholder="Todos os professores" />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="todos">Todos os professores</SelectItem>
                      {professores.length === 0 ? (
                        <SelectItem value="loading" disabled>Carregando professores...</SelectItem>
                      ) : (
                        professores.map((professor) => (
                          <SelectItem key={professor.id} value={professor.id}>
                            {professor.nome}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-black mb-2 block">
                    Nível
                  </label>
                  <Select 
                    value={filtros.nivel} 
                    onValueChange={(value) => setFiltros({...filtros, nivel: value})}
                  >
                    <SelectTrigger className="border-black/30 text-sm">
                      <SelectValue placeholder="Todos os níveis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os níveis</SelectItem>
                      <SelectItem value="Upper">Upper</SelectItem>
                      <SelectItem value="Lower">Lower</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Estatísticas Gerais - Mobile Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card className="border-black/20">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mx-auto sm:mx-0" />
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-black/60">Total de Aulas</p>
                <p className="text-lg sm:text-2xl font-bold text-black">
                  {historicoAulas.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-black/20">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mx-auto sm:mx-0" />
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-black/60">Taxa de Presença</p>
                <p className="text-lg sm:text-2xl font-bold text-black">
                  {estatisticasPresenca.taxaPresenca}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-black/20">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <UserX className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mx-auto sm:mx-0" />
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-black/60">Faltas sem Aviso</p>
                <p className="text-lg sm:text-2xl font-bold text-black">
                  {estatisticasPresenca.faltasSemAviso}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-black/20">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <UserMinus className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 mx-auto sm:mx-0" />
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm text-black/60">Faltas com Aviso</p>
                <p className="text-lg sm:text-2xl font-bold text-black">
                  {estatisticasPresenca.faltasComAviso}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Aulas em Cards */}
      <Card className="border-black/20">
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-black flex items-center gap-2">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Histórico Detalhado das Aulas</span>
            </CardTitle>
            
            {/* Mobile: Ordenação como Select */}
            <div className="block sm:hidden w-full">
              <Select value={ordenacao} onValueChange={(value: 'recente' | 'antiga') => setOrdenacao(value)}>
                <SelectTrigger className="border-black/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recente">Mais recentes primeiro</SelectItem>
                  <SelectItem value="antiga">Mais antigas primeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Desktop: Segmented Buttons para Ordenação */}
            <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                variant={ordenacao === 'recente' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setOrdenacao('recente')}
                className={cn(
                  "h-8 px-3 text-xs font-medium transition-all",
                  ordenacao === 'recente'
                    ? "bg-white text-black shadow-sm"
                    : "text-black/70 hover:text-black hover:bg-white/50"
                )}
              >
                Mais recentes primeiro
              </Button>
              <Button
                variant={ordenacao === 'antiga' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setOrdenacao('antiga')}
                className={cn(
                  "h-8 px-3 text-xs font-medium transition-all",
                  ordenacao === 'antiga'
                    ? "bg-white text-black shadow-sm"
                    : "text-black/70 hover:text-black hover:bg-white/50"
                )}
              >
                Mais antigas primeiro
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-32 sm:h-40 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : historicoAulas.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Calendar className="w-8 h-8 sm:w-12 sm:h-12 text-black/30 mx-auto mb-4" />
              <p className="text-black/60 text-base sm:text-lg font-medium mb-2">Nenhuma aula encontrada</p>
              <p className="text-black/40 text-sm sm:text-base">Ajuste os filtros para ver o histórico de aulas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              {aulasOrdenadas.map((aula) => (
                <HistoricoAulaCard key={aula.id} aula={aula} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EstatisticasAulas;
