import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const VerificarAvisosPendentes = () => {
  const [avisosPendentes, setAvisosPendentes] = useState<number>(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchAvisosPendentes = async () => {
      try {
        const { count, error } = await supabase
          .from('avisos_falta')
          .select('*', { count: 'exact' })
          .eq('aluno_id', user.id)
          .eq('status', 'pendente');

        if (error) throw error;
        setAvisosPendentes(count || 0);
      } catch (error) {
        console.error('Erro ao buscar avisos pendentes:', error);
      }
    };

    fetchAvisosPendentes();

    // Real-time updates para avisos de falta
    const channel = supabase
      .channel('avisos-falta-aluno')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'avisos_falta',
          filter: `aluno_id=eq.${user.id}`
        },
        () => {
          fetchAvisosPendentes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (avisosPendentes === 0) return null;

  return (
    <Card className="mb-6 border-amber-500 bg-amber-50">
      <CardContent className="pt-6">
        <Alert className="border-amber-500 bg-amber-50">
          <Clock className="h-4 w-4" />
          <AlertDescription className="text-amber-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>
                <strong>Aviso de Falta em Análise:</strong> Um administrador está analisando seu aviso de falta. 
                Aguarde a decisão sobre a suspensão. Você receberá uma notificação quando a análise for concluída.
              </span>
            </div>
            <p className="text-sm mt-2">
              Durante este período, você pode continuar se inscrevendo em aulas normalmente.
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default VerificarAvisosPendentes;