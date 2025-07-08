import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface SecurityCheck {
  isTimeValid: boolean;
  isDevToolsDetected: boolean;
  lastTimeCheck: Date | null;
  warnings: string[];
}

export const useSecurity = () => {
  const [securityStatus, setSecurityStatus] = useState<SecurityCheck>({
    isTimeValid: true,
    isDevToolsDetected: false,
    lastTimeCheck: null,
    warnings: []
  });

  // Debounce para evitar verificações excessivas
  const [timeCheckCache, setTimeCheckCache] = useState<{ timestamp: number; isValid: boolean } | null>(null);
  const TIME_CACHE_DURATION = 30000; // 30 segundos

  // Verificar integridade do horário (otimizada com cache)
  const checkTimeIntegrity = useCallback(async () => {
    try {
      const now = Date.now();
      
      // Usar cache se ainda válido
      if (timeCheckCache && (now - timeCheckCache.timestamp) < TIME_CACHE_DURATION) {
        setSecurityStatus(prev => ({
          ...prev,
          isTimeValid: timeCheckCache.isValid,
          lastTimeCheck: new Date()
        }));
        return;
      }

      const clientTime = new Date();
      
      // Verificação simplificada - apenas get do timestamp do servidor
      const response = await fetch('/api/time', { 
        method: 'HEAD',
        cache: 'no-cache'
      }).catch(() => null);
      
      const serverTime = response ? new Date(response.headers.get('date') || Date.now()) : new Date();
      const timeDifference = Math.abs(clientTime.getTime() - serverTime.getTime());
      
      // Permitir diferença de até 10 minutos para reduzir falsos positivos
      const maxAllowedDifference = 10 * 60 * 1000;
      const isTimeValid = timeDifference <= maxAllowedDifference;

      // Atualizar cache
      setTimeCheckCache({ timestamp: now, isValid: isTimeValid });

      if (!isTimeValid) {
        const warningMessage = 'ATENÇÃO: Horário do dispositivo incorreto. Corrija antes de continuar.';
        
        setSecurityStatus(prev => ({
          ...prev,
          isTimeValid: false,
          lastTimeCheck: clientTime,
          warnings: prev.warnings.includes(warningMessage) ? prev.warnings : [...prev.warnings, warningMessage]
        }));

        toast.error(warningMessage, { duration: 5000 });
      } else {
        setSecurityStatus(prev => ({
          ...prev,
          isTimeValid: true,
          lastTimeCheck: clientTime,
          warnings: prev.warnings.filter(w => !w.includes('horário'))
        }));
      }

    } catch (error) {
      console.error('Erro ao verificar horário:', error);
    }
  }, [timeCheckCache]);

  // Detectar uso de DevTools (otimizado)
  const detectDevTools = useCallback(() => {
    // Verificação simples e rápida
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;
    
    const devToolsOpen = widthThreshold || heightThreshold;

    if (devToolsOpen && !securityStatus.isDevToolsDetected) {
      setSecurityStatus(prev => ({
        ...prev,
        isDevToolsDetected: true,
        warnings: [...prev.warnings.filter(w => !w.includes('DevTools')), 'DevTools detectado. Feche para continuar.']
      }));

      toast.warning('DevTools detectado. Feche para continuar.', { duration: 3000 });
    } else if (!devToolsOpen && securityStatus.isDevToolsDetected) {
      setSecurityStatus(prev => ({
        ...prev,
        isDevToolsDetected: false,
        warnings: prev.warnings.filter(w => !w.includes('DevTools'))
      }));
    }
  }, [securityStatus.isDevToolsDetected]);

  // Hook principal de segurança (otimizado)
  useEffect(() => {
    // Verificação inicial mais espaçada
    checkTimeIntegrity();
    detectDevTools();

    // Verificações muito menos frequentes
    const timeInterval = setInterval(checkTimeIntegrity, 300000); // A cada 5 minutos
    const devToolsInterval = setInterval(detectDevTools, 30000); // A cada 30 segundos

    // Cleanup
    return () => {
      clearInterval(timeInterval);
      clearInterval(devToolsInterval);
    };
  }, [checkTimeIntegrity, detectDevTools]);

  // Função para validar se pode realizar ações críticas
  const canPerformCriticalAction = useCallback(() => {
    if (!securityStatus.isTimeValid) {
      toast.error('Corrija o horário do seu dispositivo antes de continuar.');
      return false;
    }

    if (securityStatus.isDevToolsDetected) {
      toast.error('Feche as ferramentas de desenvolvedor antes de continuar.');
      return false;
    }

    return true;
  }, [securityStatus]);

  // Função para mostrar aviso de segurança
  const showSecurityWarning = useCallback(() => {
    if (securityStatus.warnings.length > 0) {
      toast.error(
        'Violações de segurança detectadas. Corrija os problemas antes de continuar.',
        { duration: 8000 }
      );
    }
  }, [securityStatus.warnings]);

  return {
    securityStatus,
    checkTimeIntegrity,
    canPerformCriticalAction,
    showSecurityWarning
  };
};