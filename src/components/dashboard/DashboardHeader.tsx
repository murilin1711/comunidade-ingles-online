
import React from 'react';
import { Button } from "@/components/ui/button";
import Logo from '@/components/Logo';
import CriarAulaModal from '@/components/CriarAulaModal';
import LiberarAulasSemanaModal from '@/components/LiberarAulasSemanaModal';

interface DashboardHeaderProps {
  userName: string;
  userId: string;
  onAulaCriada: () => void;
  onAulasLiberadas: () => void;
  onLogout: () => void;
}

const DashboardHeader = ({ 
  userName, 
  userId, 
  onAulaCriada, 
  onAulasLiberadas, 
  onLogout 
}: DashboardHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4">
        <Logo size="md" />
        <div>
          <h1 className="text-3xl font-bold text-black">Dashboard do Professor</h1>
          <p className="text-black/70">Bem-vindo, {userName}!</p>
        </div>
      </div>
      <div className="flex gap-2">
        <LiberarAulasSemanaModal 
          professorId={userId} 
          onAulasLiberadas={onAulasLiberadas} 
        />
        <CriarAulaModal 
          professorId={userId} 
          onAulaCriada={onAulaCriada} 
        />
        <Button 
          onClick={onLogout} 
          variant="outline"
          className="border-black/30 text-black hover:bg-yellow-200"
        >
          Sair
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
