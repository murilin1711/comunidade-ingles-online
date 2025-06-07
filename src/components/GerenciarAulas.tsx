
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, Edit } from 'lucide-react';

interface Aula {
  id: string;
  dia_semana: number;
  horario: string;
  link_meet: string;
  capacidade: number;
  ativa: boolean;
}

interface GerenciarAulasProps {
  aulas: Aula[];
  onAulaAtualizada: () => void;
}

const GerenciarAulas = ({ aulas, onAulaAtualizada }: GerenciarAulasProps) => {
  const [loading, setLoading] = useState(false);

  const diasSemana = [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
  ];

  const handleExcluirAula = async (aulaId: string, dia: string, horario: string) => {
    const confirmacao = window.confirm(`Tem certeza que deseja excluir a aula de ${dia} às ${horario}?`);
    
    if (!confirmacao) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('aulas')
        .update({ ativa: false })
        .eq('id', aulaId);

      if (error) throw error;

      toast.success('Aula excluída com sucesso');
      onAulaAtualizada();
    } catch (error) {
      console.error('Erro ao excluir aula:', error);
      toast.error('Erro ao excluir aula');
    } finally {
      setLoading(false);
    }
  };

  const aulasAtivas = aulas.filter(aula => aula.ativa);

  return (
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
                    </div>
                    <p className="text-sm text-black/60 break-all">
                      Meet: {aula.link_meet}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-black/30 text-black hover:bg-yellow-50"
                    >
                      <Edit className="w-4 h-4" />
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
  );
};

export default GerenciarAulas;
