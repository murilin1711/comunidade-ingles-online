
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAdminStats } from '@/hooks/admin/useAdminStats';
import { Trophy, TrendingUp, Users, Calendar, Filter } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

const EstatisticasProfessores = () => {
  const [filtros, setFiltros] = useState({
    periodo: '30',
    nivel: 'todos'
  });

  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const { 
    estatisticasProfessores, 
    rankingProfessores, 
    loading, 
    fetchEstatisticasProfessores 
  } = useAdminStats();

  useEffect(() => {
    fetchEstatisticasProfessores(filtros);
  }, [filtros, fetchEstatisticasProfessores]);

  const getStatusOcupacao = (taxa: number) => {
    if (taxa >= 90) return { label: 'Excelente', color: 'bg-green-500' };
    if (taxa >= 70) return { label: 'Boa', color: 'bg-yellow-500' };
    if (taxa >= 50) return { label: 'Regular', color: 'bg-orange-500' };
    return { label: 'Baixa', color: 'bg-red-500' };
  };

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
                  <span className="text-sm sm:text-base">Filtros de Período</span>
                </CardTitle>
                <Calendar className={cn(
                  "w-4 h-4 transition-transform",
                  filtrosAbertos && "rotate-180"
                )} />
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-sm font-medium text-black mb-2 block">
                    Período
                  </label>
                  <Select 
                    value={filtros.periodo} 
                    onValueChange={(value) => setFiltros({...filtros, periodo: value})}
                  >
                    <SelectTrigger className="border-black/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">Últimos 30 dias</SelectItem>
                      <SelectItem value="90">Último trimestre</SelectItem>
                      <SelectItem value="180">Último semestre</SelectItem>
                      <SelectItem value="365">Último ano</SelectItem>
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
                    <SelectTrigger className="border-black/30">
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

      {/* Ranking dos Professores */}
      <Card className="border-black/20">
        <CardHeader>
          <CardTitle className="text-black flex items-center gap-2">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Ranking dos Professores Mais Ativos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-black/60 text-sm">Carregando ranking...</p>
            </div>
          ) : rankingProfessores.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-black/60 text-sm">Nenhum dado encontrado para o período selecionado.</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {rankingProfessores.slice(0, 3).map((professor, index) => (
                <div key={professor.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/50 rounded-lg border border-black/10">
                  <div className="flex-shrink-0">
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      'bg-orange-400'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="font-semibold text-black text-sm sm:text-base truncate">{professor.nome}</h3>
                    <p className="text-xs sm:text-sm text-black/60">
                      {professor.totalAulas} aulas ministradas
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-medium text-black text-sm sm:text-base">{professor.taxaOcupacao}%</p>
                    <p className="text-xs text-black/60 hidden sm:block">Taxa de ocupação</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas Detalhadas */}
      <Card className="border-black/20">
        <CardHeader>
          <CardTitle className="text-black flex items-center gap-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Desempenho Detalhado dos Professores</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-black/60 text-sm">Carregando estatísticas...</p>
            </div>
          ) : estatisticasProfessores.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-black/60 text-sm">Nenhum dado encontrado para o período selecionado.</p>
            </div>
          ) : (
            <>
              {/* Mobile: Cards Layout */}
              <div className="block sm:hidden space-y-3">
                {estatisticasProfessores.map((professor) => {
                  const statusOcupacao = getStatusOcupacao(professor.taxaOcupacao);
                  return (
                    <Card key={professor.id} className="border border-black/10">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-black text-sm truncate pr-2">
                              {professor.nome}
                            </h3>
                            <Badge className={`${statusOcupacao.color} text-white text-xs`}>
                              {statusOcupacao.label}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-black/60">Aulas</p>
                              <p className="font-medium text-black">{professor.totalAulas}</p>
                            </div>
                            <div>
                              <p className="text-black/60">Alunos</p>
                              <p className="font-medium text-black">{professor.alunosAtendidos}</p>
                            </div>
                            <div>
                              <p className="text-black/60">Ocupação</p>
                              <p className="font-medium text-black">{professor.taxaOcupacao}%</p>
                            </div>
                            <div>
                              <p className="text-black/60">Presença</p>
                              <p className="font-medium text-black">{professor.mediaPresenca}%</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop: Table Layout */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-black">Professor</TableHead>
                      <TableHead className="text-black">Aulas Ministradas</TableHead>
                      <TableHead className="text-black">Total de Vagas</TableHead>
                      <TableHead className="text-black">Alunos Atendidos</TableHead>
                      <TableHead className="text-black">Taxa de Ocupação</TableHead>
                      <TableHead className="text-black">Status</TableHead>
                      <TableHead className="text-black">Média de Presença</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estatisticasProfessores.map((professor) => {
                      const statusOcupacao = getStatusOcupacao(professor.taxaOcupacao);
                      return (
                        <TableRow key={professor.id}>
                          <TableCell className="font-medium text-black">
                            {professor.nome}
                          </TableCell>
                          <TableCell className="text-black">
                            {professor.totalAulas}
                          </TableCell>
                          <TableCell className="text-black">
                            {professor.totalVagas}
                          </TableCell>
                          <TableCell className="text-black">
                            {professor.alunosAtendidos}
                          </TableCell>
                          <TableCell className="text-black font-medium">
                            {professor.taxaOcupacao}%
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusOcupacao.color} text-white`}>
                              {statusOcupacao.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-black">
                            {professor.mediaPresenca}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EstatisticasProfessores;
