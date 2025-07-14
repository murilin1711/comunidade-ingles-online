
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, Edit, CheckCircle } from 'lucide-react';
import EditarAulaModal from './EditarAulaModal';

interface Aula {
  id: string;
  dia_semana: number;
  horario: string;
  link_meet: string;
  capacidade: number;
  ativa: boolean;
  nivel: string;
  professor_nome?: string;
}

interface GerenciarAulasProps {
  aulas: Aula[];
  onAulaAtualizada: () => void;
}

const GerenciarAulas = ({ aulas, onAulaAtualizada }: GerenciarAulasProps) => {
  const [loading, setLoading] = useState(false);
  const [aulaParaEditar, setAulaParaEditar] = useState<Aula | null>(null);
  const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);

  const diasSemana = [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
  ];

  const handleExcluirAula = async (aulaId: string, dia: string, horario: string) => {
    const confirmacao = window.confirm(
      `Tem certeza que deseja desativar a aula de ${dia} às ${horario}?\n\n` +
      `⚠️ IMPORTANTE:\n` +
      `• Os dados da aula serão preservados no histórico\n` +
      `• A aula ficará invisível para os alunos\n` +
      `• Você pode reativá-la depois no painel administrativo`
    );
    
    if (!confirmacao) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('aulas')
        .update({ ativa: false })
        .eq('id', aulaId);

      if (error) throw error;

      toast.success('Aula desativada com sucesso! Os dados foram salvos no histórico.');
      onAulaAtualizada();
    } catch (error) {
      console.error('Erro ao desativar aula:', error);
      toast.error('Erro ao desativar aula');
    } finally {
      setLoading(false);
    }
  };

  const handleEditarAula = (aula: Aula) => {
    setAulaParaEditar(aula);
    setModalEdicaoAberto(true);
  };

  const handleConcluirAula = async (aulaId: string, dia: string, horario: string) => {
    const confirmacao = window.confirm(
      `Tem certeza que deseja marcar a aula de ${dia} às ${horario} como concluída?\n\n` +
      `⚠️ IMPORTANTE:\n` +
      `• A aula será salva no histórico com todos os dados atuais\n` +
      `• Ela ficará marcada como "Concluída" no histórico\n` +
      `• Esta ação não pode ser desfeita`
    );
    
    if (!confirmacao) return;

    setLoading(true);
    try {
      // Marcar aula como inativa e definir data_aula para hoje (concluída)
      const hoje = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('aulas')
        .update({ 
          ativa: false,
          data_aula: hoje // Define data como hoje para marcar como concluída
        })
        .eq('id', aulaId);

      if (error) throw error;

      toast.success('Aula marcada como concluída e salva no histórico!');
      onAulaAtualizada();
    } catch (error) {
      console.error('Erro ao concluir aula:', error);
      toast.error('Erro ao concluir aula');
    } finally {
      setLoading(false);
    }
  };

  const aulasAtivas = aulas.filter(aula => aula.ativa);

  return (
    <>
      <Card className="border-black/20">
        <CardHeader>
          <CardTitle className="text-black">Minhas Aulas</CardTitle>
        </CardHeader>
        <CardContent>
          {aulasAtivas.length === 0 ? (
            <p className="text-black/60 text-center">Nenhuma aula criada ainda.</p>
          ) : (
            <div className="space-y-3">
              {aulasAtivas.map((aula) => (
                <div key={aula.id} className="border border-black/20 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-black">
                          {diasSemana[aula.dia_semana]} - {aula.horario}
                        </h3>
                        <Badge className="bg-yellow-500 text-black">
                          {aula.capacidade} vagas
                        </Badge>
                        <Badge variant="outline" className="border-black/30 text-black">
                          {aula.nivel}
                        </Badge>
                      </div>
                      {aula.professor_nome && (
                        <p className="text-sm text-black/60 mb-1">
                          Professor: {aula.professor_nome}
                        </p>
                      )}
                      <p className="text-sm text-black/60 break-all">
                        Meet: {aula.link_meet}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditarAula(aula)}
                        className="border-black/30 text-black hover:bg-yellow-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => handleConcluirAula(
                          aula.id, 
                          diasSemana[aula.dia_semana], 
                          aula.horario
                        )}
                        disabled={loading}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleExcluirAula(
                          aula.id, 
                          diasSemana[aula.dia_semana], 
                          aula.horario
                        )}
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <EditarAulaModal
        aula={aulaParaEditar}
        open={modalEdicaoAberto}
        onOpenChange={setModalEdicaoAberto}
        onAulaAtualizada={onAulaAtualizada}
      />
    </>
  );
};

export default GerenciarAulas;
