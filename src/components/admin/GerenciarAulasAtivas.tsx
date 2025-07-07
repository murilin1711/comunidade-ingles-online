import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Edit, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Aula {
  id: string;
  professor_id: string;
  professor_nome: string;
  dia_semana: number;
  horario: string;
  link_meet: string;
  nivel: string;
  data_aula: string | null;
  ativa: boolean;
  capacidade: number;
  inscricoes_count?: number;
}

interface GerenciarAulasAtivasProps {
  onEditarAula: (aula: Aula) => void;
}

const GerenciarAulasAtivas = ({ onEditarAula }: GerenciarAulasAtivasProps) => {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState('todas');
  const [busca, setBusca] = useState('');

  const diasSemana = [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
  ];

  useEffect(() => {
    fetchAulas();
  }, []);

  const fetchAulas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('aulas')
        .select(`
          *,
          inscricoes!inscricoes_aula_id_fkey(
            id,
            status
          )
        `)
        .order('data_aula', { ascending: false })
        .order('horario');

      if (error) throw error;

      const aulasComContagem = data?.map(aula => ({
        ...aula,
        inscricoes_count: aula.inscricoes?.filter(i => 
          i.status === 'confirmado' || i.status === 'espera'
        ).length || 0
      })) || [];

      setAulas(aulasComContagem);
    } catch (error) {
      console.error('Erro ao buscar aulas:', error);
      toast.error('Erro ao carregar aulas');
    } finally {
      setLoading(false);
    }
  };

  const toggleAulaAtiva = async (aulaId: string, novoStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('aulas')
        .update({ ativa: novoStatus })
        .eq('id', aulaId);

      if (error) throw error;

      toast.success(`Aula ${novoStatus ? 'ativada' : 'desativada'} com sucesso!`);
      fetchAulas();
    } catch (error) {
      console.error('Erro ao atualizar status da aula:', error);
      toast.error('Erro ao atualizar status da aula');
    }
  };

  const getStatusAula = (aula: Aula) => {
    if (!aula.data_aula) return 'sem_data';
    
    const dataAula = new Date(aula.data_aula);
    const hoje = new Date();
    
    if (dataAula < hoje) return 'concluida';
    if (!aula.ativa) return 'inativa';
    return 'ativa';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativa':
        return <Badge className="bg-green-500 text-white">Ativa</Badge>;
      case 'inativa':
        return <Badge variant="secondary">Inativa</Badge>;
      case 'concluida':
        return <Badge className="bg-blue-500 text-white">Concluída</Badge>;
      case 'sem_data':
        return <Badge variant="outline">Sem Data</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const aulasFiltradas = aulas.filter(aula => {
    const status = getStatusAula(aula);
    
    // Filtro por status
    if (filtro !== 'todas') {
      if (filtro !== status) return false;
    }
    
    // Filtro por busca
    if (busca) {
      const termoBusca = busca.toLowerCase();
      const match = 
        aula.professor_nome?.toLowerCase().includes(termoBusca) ||
        aula.nivel.toLowerCase().includes(termoBusca) ||
        diasSemana[aula.dia_semana].toLowerCase().includes(termoBusca) ||
        aula.horario.includes(termoBusca);
      
      if (!match) return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filtros e Busca */}
      <Card className="border-black/20">
        <CardHeader>
          <CardTitle className="text-black">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Status</label>
              <Select value={filtro} onValueChange={setFiltro}>
                <SelectTrigger className="border-black/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="ativa">Ativas</SelectItem>
                  <SelectItem value="inativa">Inativas</SelectItem>
                  <SelectItem value="concluida">Concluídas</SelectItem>
                  <SelectItem value="sem_data">Sem Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-black">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/60 w-4 h-4" />
                <Input
                  placeholder="Professor, nível, dia, horário..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10 border-black/30"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Aulas */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8 text-black/60">Carregando aulas...</div>
        ) : aulasFiltradas.length === 0 ? (
          <div className="text-center py-8 text-black/60">Nenhuma aula encontrada</div>
        ) : (
          aulasFiltradas.map((aula) => {
            const status = getStatusAula(aula);
            
            return (
              <Card key={aula.id} className="border-black/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-black">
                          {diasSemana[aula.dia_semana]} - {aula.horario}
                        </h3>
                        {getStatusBadge(status)}
                        <Badge variant="outline" className="border-black/30">
                          {aula.nivel}
                        </Badge>
                        <Badge className="bg-yellow-500 text-black">
                          {aula.inscricoes_count || 0}/{aula.capacidade} vagas
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-black/80">
                        <p><strong>Professor:</strong> {aula.professor_nome}</p>
                        {aula.data_aula && (
                          <p><strong>Data:</strong> {format(new Date(aula.data_aula), "dd/MM/yyyy", { locale: ptBR })}</p>
                        )}
                        <p className="break-all"><strong>Meet:</strong> {aula.link_meet}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-6">
                      {/* Toggle Ativo/Inativo */}
                      {status !== 'concluida' && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-black">
                            {aula.ativa ? 'Ativa' : 'Inativa'}
                          </span>
                          <Switch
                            checked={aula.ativa}
                            onCheckedChange={(checked) => toggleAulaAtiva(aula.id, checked)}
                          />
                        </div>
                      )}

                      {/* Botão Editar */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEditarAula(aula)}
                        className="border-black/30 text-black hover:bg-yellow-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GerenciarAulasAtivas;