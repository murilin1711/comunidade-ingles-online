import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAdminStats } from '@/hooks/admin/useAdminStats';
import { Trophy, TrendingUp, Users, Calendar } from 'lucide-react';

const EstatisticasProfessores = () => {
  const [filtros, setFiltros] = useState({
    periodo: '30',
    nivel: 'todos'
  });

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
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-black/20">
        <CardHeader>
          <CardTitle className="text-black flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Filtros de Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </Card>

      {/* Ranking dos Professores */}
      <Card className="border-black/20">
        <CardHeader>
          <CardTitle className="text-black flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Ranking dos Professores Mais Ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-black/60">Carregando ranking...</p>
            </div>
          ) : rankingProfessores.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-black/60">Nenhum dado encontrado para o período selecionado.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rankingProfessores.slice(0, 3).map((professor, index) => (
                <div key={professor.id} className="flex items-center gap-4 p-4 bg-white/50 rounded-lg border border-black/10">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      'bg-orange-400'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-semibold text-black">{professor.nome}</h3>
                    <p className="text-sm text-black/60">
                      {professor.totalAulas} aulas ministradas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-black">{professor.taxaOcupacao}%</p>
                    <p className="text-sm text-black/60">Taxa de ocupação</p>
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
            <TrendingUp className="w-5 h-5" />
            Desempenho Detalhado dos Professores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-black/60">Carregando estatísticas...</p>
            </div>
          ) : estatisticasProfessores.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-black/60">Nenhum dado encontrado para o período selecionado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EstatisticasProfessores;