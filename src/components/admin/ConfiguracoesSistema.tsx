import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import { useConfiguracoesAdmin } from '@/hooks/useConfiguracoesAdmin';
import { Settings, Clock, AlertTriangle, Calendar, Save } from 'lucide-react';

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

  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState(formData);

  useEffect(() => {
    fetchConfiguracoes();
  }, [fetchConfiguracoes]);

  useEffect(() => {
    if (configuracoes) {
      const newData = {
        faltaComAvisoMais4h: configuracoes.faltaComAvisoMais4h || 2,
        faltaComAvisoMenos4h: configuracoes.faltaComAvisoMenos4h || 3,
        faltaSemAviso: configuracoes.faltaSemAviso || 4,
        horasMinimaBaixaCansulamento: configuracoes.horasMinimaBaixaCansulamento || 4,
        diaLiberacao: configuracoes.diaLiberacao || 1,
        horarioLiberacao: configuracoes.horarioLiberacao || '12:30',
        mensagemPeriodoInscricao: configuracoes.mensagemPeriodoInscricao || 'As inscrições abrem toda segunda-feira às 12:30.',
        mensagemRegrasSuspensao: configuracoes.mensagemRegrasSuspensao || 'Faltas sem aviso resultam em suspensão de 4 semanas.'
      };
      setFormData(newData);
      setOriginalData(newData);
      setHasChanges(false);
    }
  }, [configuracoes]);

  // Função para gerar mensagens automaticamente
  const gerarMensagensAutomaticas = (diaLiberacao: number, horarioLiberacao: string) => {
    const diasSemana = [
      'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 
      'quinta-feira', 'sexta-feira', 'sábado'
    ];
    
    const diaNome = diasSemana[diaLiberacao];
    return {
      mensagemPeriodoInscricao: `As inscrições abrem toda ${diaNome} às ${horarioLiberacao}.`,
      mensagemRegrasSuspensao: 'Faltas sem aviso resultam em suspensão de 4 semanas.'
    };
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Se mudou dia ou horário de liberação, atualizar mensagens automaticamente
      if (field === 'diaLiberacao' || field === 'horarioLiberacao') {
        const novasDiaLiber = field === 'diaLiberacao' ? Number(value) : newData.diaLiberacao;
        const novoHorarioLiber = field === 'horarioLiberacao' ? String(value) : newData.horarioLiberacao;
        
        const mensagensAtualizadas = gerarMensagensAutomaticas(novasDiaLiber, novoHorarioLiber);
        Object.assign(newData, mensagensAtualizadas);
      }
      
      return newData;
    });
  };

  // Detectar mudanças para mostrar botão salvar
  useEffect(() => {
    const hasChangesNow = JSON.stringify(formData) !== JSON.stringify(originalData);
    setHasChanges(hasChangesNow);
  }, [formData, originalData]);

  const handleSalvar = async () => {
    try {
      await salvarConfiguracoes(formData);
      setOriginalData(formData);
      setHasChanges(false);
      toast.success('Configurações salvas com sucesso! As regras de liberação e fechamento foram atualizadas automaticamente.');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  const diasSemana = [
    { value: 0, label: 'Domingo' },
    { value: 1, label: 'Segunda-feira' },
    { value: 2, label: 'Terça-feira' },
    { value: 3, label: 'Quarta-feira' },
    { value: 4, label: 'Quinta-feira' },
    { value: 5, label: 'Sexta-feira' },
    { value: 6, label: 'Sábado' }
  ];

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-black/60">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Regras de Suspensão */}
      <Card className="border-black/20">
        <CardHeader>
          <CardTitle className="text-black flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Regras de Suspensão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="faltaComAvisoMais4h" className="text-black">
                Falta com aviso ≥ {formData.horasMinimaBaixaCansulamento}h antes
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="faltaComAvisoMais4h"
                  type="number"
                  min="1"
                  max="12"
                  value={formData.faltaComAvisoMais4h}
                  onChange={(e) => handleInputChange('faltaComAvisoMais4h', parseInt(e.target.value))}
                  className="border-black/30"
                />
                <span className="text-black">semana(s)</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="faltaComAvisoMenos4h" className="text-black">
                Falta com aviso &lt; {formData.horasMinimaBaixaCansulamento}h antes
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="faltaComAvisoMenos4h"
                  type="number"
                  min="1"
                  max="12"
                  value={formData.faltaComAvisoMenos4h}
                  onChange={(e) => handleInputChange('faltaComAvisoMenos4h', parseInt(e.target.value))}
                  className="border-black/30"
                />
                <span className="text-black">semana(s)</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="faltaSemAviso" className="text-black">
                Falta sem aviso
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="faltaSemAviso"
                  type="number"
                  min="1"
                  max="12"
                  value={formData.faltaSemAviso}
                  onChange={(e) => handleInputChange('faltaSemAviso', parseInt(e.target.value))}
                  className="border-black/30"
                />
                <span className="text-black">semana(s)</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="horasMinimaBaixaCansulamento" className="text-black">
                Horas mínimas para cancelamento sem punição
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="horasMinimaBaixaCansulamento"
                  type="number"
                  min="1"
                  max="48"
                  value={formData.horasMinimaBaixaCansulamento}
                  onChange={(e) => handleInputChange('horasMinimaBaixaCansulamento', parseInt(e.target.value))}
                  className="border-black/30"
                />
                <span className="text-black">hora(s)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Configurações de Liberação das Aulas */}
      <Card className="border-black/20">
        <CardHeader>
          <CardTitle className="text-black flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Liberação das Aulas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="diaLiberacao" className="text-black">
                Dia da semana para liberação
              </Label>
              <Select
                value={formData.diaLiberacao.toString()}
                onValueChange={(value) => handleInputChange('diaLiberacao', parseInt(value))}
              >
                <SelectTrigger className="border-black/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {diasSemana.map((dia) => (
                    <SelectItem key={dia.value} value={dia.value.toString()}>
                      {dia.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="horarioLiberacao" className="text-black">
                Horário de liberação
              </Label>
              <Input
                id="horarioLiberacao"
                type="time"
                value={formData.horarioLiberacao}
                onChange={(e) => handleInputChange('horarioLiberacao', e.target.value)}
                className="border-black/30"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Mensagens para Dashboard do Aluno */}
      <Card className="border-black/20">
        <CardHeader>
          <CardTitle className="text-black flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Mensagens do Dashboard do Aluno
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="mensagemPeriodoInscricao" className="text-black">
              Mensagem sobre período de inscrições
            </Label>
            <Input
              id="mensagemPeriodoInscricao"
              value={formData.mensagemPeriodoInscricao}
              onChange={(e) => handleInputChange('mensagemPeriodoInscricao', e.target.value)}
              className="border-black/30"
              placeholder="Mensagem sobre quando as inscrições abrem"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mensagemRegrasSuspensao" className="text-black">
              Mensagem sobre regras de suspensão
            </Label>
            <Input
              id="mensagemRegrasSuspensao"
              value={formData.mensagemRegrasSuspensao}
              onChange={(e) => handleInputChange('mensagemRegrasSuspensao', e.target.value)}
              className="border-black/30"
              placeholder="Mensagem sobre as regras de suspensão"
            />
          </div>
        </CardContent>
      </Card>

      {/* Botão Salvar - só aparece quando há mudanças */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button
            onClick={handleSalvar}
            className="bg-yellow-500 hover:bg-yellow-600 text-black animate-pulse"
            disabled={loading}
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar Configurações
          </Button>
        </div>
      )}
    </div>
  );
};

export default ConfiguracoesSistema;