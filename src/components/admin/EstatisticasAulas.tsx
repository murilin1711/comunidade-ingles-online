import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminStats } from '@/hooks/useAdminStats';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Users, UserCheck, UserX, UserMinus } from 'lucide-react';

const EstatisticasAulas = () => {
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    professor: '',
    nivel: ''
  });

  const { 
    historicoAulas, 
    estatisticasPresenca, 
    loading, 
    fetchHistoricoAulas 
  } = useAdminStats();

  useEffect(() => {
    fetchHistoricoAulas(filtros);
  }, [filtros, fetchHistoricoAulas]);

  const diasSemana = [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
  ];

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="border-black/20">
        <CardHeader>
          <CardTitle className="text-black flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-black mb-2 block">
                Data Início
              </label>
              <Input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({...filtros, dataInicio: e.target.value})}
                className="border-black/30"
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
                className="border-black/30"
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
                <SelectTrigger className="border-black/30">
                  <SelectValue placeholder="Todos os professores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os professores</SelectItem>
                  {/* Será preenchido dinamicamente */}
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
                  <SelectItem value="">Todos os níveis</SelectItem>
                  <SelectItem value="Upper">Upper</SelectItem>
                  <SelectItem value="Lower">Lower</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-black/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-black/60">Total de Aulas</p>
                <p className="text-2xl font-bold text-black">
                  {historicoAulas.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-black/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-black/60">Taxa de Presença</p>
                <p className="text-2xl font-bold text-black">
                  {estatisticasPresenca.taxaPresenca}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-black/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-black/60">Faltas sem Aviso</p>
                <p className="text-2xl font-bold text-black">
                  {estatisticasPresenca.faltasSemAviso}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-black/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserMinus className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-black/60">Faltas com Aviso</p>
                <p className="text-2xl font-bold text-black">
                  {estatisticasPresenca.faltasComAviso}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Aulas */}
      <Card className="border-black/20">
        <CardHeader>
          <CardTitle className="text-black flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Histórico Detalhado das Aulas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-black/60">Carregando dados...</p>
            </div>
          ) : historicoAulas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-black/60">Nenhuma aula encontrada com os filtros aplicados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-black">Aula</TableHead>
                    <TableHead className="text-black">Professor</TableHead>
                    <TableHead className="text-black">Data/Hora</TableHead>
                    <TableHead className="text-black">Nível</TableHead>
                    <TableHead className="text-black">Confirmados</TableHead>
                    <TableHead className="text-black">Presentes</TableHead>
                    <TableHead className="text-black">Faltas</TableHead>
                    <TableHead className="text-black">Lista de Espera</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicoAulas.map((aula) => (
                    <TableRow key={aula.id}>
                      <TableCell className="font-medium text-black">
                        {diasSemana[aula.dia_semana]} - {aula.horario}
                      </TableCell>
                      <TableCell className="text-black">
                        {aula.professor_nome}
                      </TableCell>
                      <TableCell className="text-black">
                        {aula.data_aula ? format(new Date(aula.data_aula), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-black/30 text-black">
                          {aula.nivel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-black">
                        {aula.confirmados?.length || 0}/{aula.capacidade}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {aula.presentes?.length || 0}
                      </TableCell>
                      <TableCell className="text-red-600 font-medium">
                        {aula.faltas?.length || 0}
                      </TableCell>
                      <TableCell className="text-orange-600 font-medium">
                        {aula.listaEspera?.length || 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EstatisticasAulas;