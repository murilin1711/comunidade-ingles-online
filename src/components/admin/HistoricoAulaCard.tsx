import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Users, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import HistoricoAulaModal from './HistoricoAulaModal';
interface HistoricoAula {
  id: string;
  dia_semana: number;
  horario: string;
  nivel: string;
  professor_nome: string;
  data_aula?: string | null;
  capacidade: number;
  ativa: boolean;
  inscricoes_abertas: boolean;
  confirmados?: any[];
  presentes?: any[];
  faltas?: any[];
  listaEspera?: any[];
  avisosFalta?: Array<{
    id: string;
    aluno_id: string;
    aula_id: string;
    status: string;
    motivo?: string;
  }>;
}
interface HistoricoAulaCardProps {
  aula: HistoricoAula;
}
const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const HistoricoAulaCard = ({
  aula
}: HistoricoAulaCardProps) => {
  const [modalAberto, setModalAberto] = useState(false);
  const confirmadosCount = aula.confirmados?.length || 0;
  const presentesCount = aula.presentes?.length || 0;
  const faltasCount = aula.faltas?.length || 0;
  const listaEsperaCount = aula.listaEspera?.length || 0;

  // Melhorar lógica de status da aula
  const getStatusAula = () => {
    // Se não está ativa, verificar se tem data definida
    if (!aula.ativa) {
      if (aula.data_aula) {
        const dataAula = new Date(aula.data_aula);
        const hoje = new Date();
        // Se tem data e já passou, foi concluída
        if (dataAula <= hoje) {
          return 'concluida';
        }
      }
      // Se não tem data ou a data não passou, foi apenas desativada
      return 'inativa';
    }

    // Se está ativa, verificar se tem data e se já passou
    if (aula.data_aula) {
      const dataAula = new Date(aula.data_aula);
      const hoje = new Date();
      if (dataAula < hoje) {
        return 'concluida';
      }
    }
    return 'ativa';
  };
  const statusAula = getStatusAula();
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativa':
        return <Badge className="bg-green-500 text-white">Ativa</Badge>;
      case 'inativa':
        return <Badge variant="secondary">Inativa</Badge>;
      case 'concluida':
        return <Badge className="bg-blue-500 text-white">Concluída</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };
  return <>
      <Card className="border-black/20 relative overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-black">
                  {diasSemana[aula.dia_semana]} - {aula.horario}
                </h3>
                <p className="text-sm text-black/60">
                  {aula.professor_nome}
                </p>
              </div>
            </div>
            {getStatusBadge(statusAula)}
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-black/30 text-black">
                {aula.nivel}
              </Badge>
              {aula.data_aula && <div className="flex items-center gap-1 text-sm text-black/60">
                  <Clock className="w-4 h-4" />
                  {format(new Date(aula.data_aula), 'dd/MM/yyyy', {
                locale: ptBR
              })}
                </div>}
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm my-0">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-black/60">Confirmados:</span>
                <span className="font-medium text-black">{confirmadosCount}/{aula.capacidade}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-black/60">Lista de Espera:</span>
                <span className="font-medium text-black">{listaEsperaCount}</span>
              </div>
              {(statusAula === 'concluida' || presentesCount > 0 || faltasCount > 0) && <>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-black/60">Presentes:</span>
                    <span className="font-medium text-green-600">{presentesCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    <span className="text-black/60">Faltas:</span>
                    <span className="font-medium text-red-600">{faltasCount}</span>
                  </div>
                </>}
            </div>
          </div>

          <Button onClick={() => setModalAberto(true)} size="sm" className="absolute bottom-4 right-4 h-8 bg-yellow-500 hover:bg-yellow-600 text-black border-0 px-[11px] mx-0 my-[40px]">
            <Settings className="w-4 h-4 mr-1" />
            Gerenciar
          </Button>
        </CardContent>
      </Card>

        <HistoricoAulaModal aula={aula} open={modalAberto} onOpenChange={setModalAberto} onAulaApagada={() => window.location.reload()} />
    </>;
};
export default HistoricoAulaCard;