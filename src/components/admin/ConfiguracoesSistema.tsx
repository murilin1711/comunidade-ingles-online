import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import { useConfiguracoesAdmin } from '@/hooks/useConfiguracoesAdmin';
import { Save } from 'lucide-react';
import SuspensionRulesCard from './config/SuspensionRulesCard';
import ClassReleaseCard from './config/ClassReleaseCard';
import DashboardMessagesCard from './config/DashboardMessagesCard';

const ConfiguracoesSistema = () => {
  const {
    configuracoes,
    loading,
    fetchConfiguracoes,
    salvarConfiguracoes
  } = useConfiguracoesAdmin();

  const [formData, setFormData] = useState({
    // Configurações de Suspensão
    faltaComAvisoMais4h: 2,
    faltaComAvisoMenos4h: 3,
    faltaSemAviso: 4,
    horasMinimaBaixaCansulamento: 4,

    // Configurações de Liberação
    diaLiberacao: 1, // Segunda-feira
    horarioLiberacao: '12:30',

    // Mensagens para o Dashboard do Aluno
    mensagemPeriodoInscricao: 'As inscrições abrem toda segunda-feira às 12:30.',
    mensagemRegrasSuspensao: 'Faltas sem aviso resultam em suspensão de 4 semanas.'
  });

  useEffect(() => {
    fetchConfiguracoes();
  }, [fetchConfiguracoes]);

  useEffect(() => {
    if (configuracoes) {
      setFormData({
        faltaComAvisoMais4h: configuracoes.faltaComAvisoMais4h || 2,
        faltaComAvisoMenos4h: configuracoes.faltaComAvisoMenos4h || 3,
        faltaSemAviso: configuracoes.faltaSemAviso || 4,
        horasMinimaBaixaCansulamento: configuracoes.horasMinimaBaixaCansulamento || 4,
        diaLiberacao: configuracoes.diaLiberacao || 1,
        horarioLiberacao: configuracoes.horarioLiberacao || '12:30',
        mensagemPeriodoInscricao: configuracoes.mensagemPeriodoInscricao || 'As inscrições abrem toda segunda-feira às 12:30.',
        mensagemRegrasSuspensao: configuracoes.mensagemRegrasSuspensao || 'Faltas sem aviso resultam em suspensão de 4 semanas.'
      });
    }
  }, [configuracoes]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSalvar = async () => {
    try {
      await salvarConfiguracoes(formData);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    }
  };


  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-black/60">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SuspensionRulesCard 
        formData={formData} 
        onInputChange={handleInputChange} 
      />

      <Separator />

      <ClassReleaseCard 
        formData={formData} 
        onInputChange={handleInputChange} 
      />

      <Separator />

      <DashboardMessagesCard 
        formData={formData} 
        onInputChange={handleInputChange} 
      />

      <div className="flex justify-end">
        <Button
          onClick={handleSalvar}
          className="bg-yellow-500 hover:bg-yellow-600 text-black"
          disabled={loading}
        >
          <Save className="w-4 h-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default ConfiguracoesSistema;