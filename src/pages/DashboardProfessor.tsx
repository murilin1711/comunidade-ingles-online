
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardProfessor } from '@/hooks/useDashboardProfessor';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import GerenciarAulas from '@/components/GerenciarAulas';
import AulaSelector from '@/components/dashboard/AulaSelector';
import ConfirmadosList from '@/components/dashboard/ConfirmadosList';
import ListaEsperaCard from '@/components/dashboard/ListaEsperaCard';

const DashboardProfessor = () => {
  const { user, userData, logout } = useAuth();
  const {
    aulas,
    aulaSelecionada,
    setAulaSelecionada,
    confirmados,
    listaEspera,
    loading,
    fetchAulas,
    handleMarcarPresenca,
    handleMarcarFalta
  } = useDashboardProfessor();

  const aulaSelecionadaData = aulas.find(a => a.id === aulaSelecionada);

  if (!userData || userData.role !== 'professor') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-black mb-2">Acesso negado</h2>
          <p className="text-black/60">Esta área é restrita para professores.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 p-4">
      <div className="max-w-6xl mx-auto">
        <DashboardHeader
          userName={userData.nome}
          userId={user?.id || ''}
          onAulaCriada={fetchAulas}
          onLogout={logout}
        />

        <div className="grid gap-6 mb-6">
          <GerenciarAulas aulas={aulas} onAulaAtualizada={fetchAulas} />
        </div>

        <AulaSelector
          aulas={aulas}
          aulaSelecionada={aulaSelecionada}
          onAulaChange={setAulaSelecionada}
        />

        {aulaSelecionada && aulaSelecionadaData && (
          <div className="grid md:grid-cols-2 gap-6">
            <ConfirmadosList
              confirmados={confirmados}
              capacidade={aulaSelecionadaData.capacidade}
              loading={loading}
              onMarcarPresenca={handleMarcarPresenca}
              onMarcarFalta={handleMarcarFalta}
            />
            <ListaEsperaCard listaEspera={listaEspera} />
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardProfessor;
