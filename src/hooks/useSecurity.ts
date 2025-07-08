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

  // Verificar integridade do horário comparando com servidor
  const checkTimeIntegrity = useCallback(async () => {
    try {
      const clientTime = new Date();
      
      // Buscar horário do servidor via Supabase
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('atualizado_em')
        .limit(1)
        .single();

      if (error) {
        console.warn('Não foi possível verificar horário do servidor:', error);
        return;
      }

      const serverTime = new Date(data.atualizado_em);
      const timeDifference = Math.abs(clientTime.getTime() - serverTime.getTime());
      
      // Permitir diferença de até 5 minutos (300000ms)
      const maxAllowedDifference = 5 * 60 * 1000;
      const isTimeValid = timeDifference <= maxAllowedDifference;

      if (!isTimeValid) {
        const warningMessage = 'ATENÇÃO: Detectamos uma discrepância no horário do seu dispositivo. Para garantir a integridade do sistema, você deve corrigir o horário antes de continuar. Tentativas de burlar o sistema podem resultar em advertência.';
        
        setSecurityStatus(prev => ({
          ...prev,
          isTimeValid: false,
          lastTimeCheck: clientTime,
          warnings: [...prev.warnings, warningMessage]
        }));

        toast.error(warningMessage, {
          duration: 10000,
        });
        
        // Log da tentativa de burla para auditoria
        console.warn('Possível tentativa de burla detectada - horário inconsistente', {
          clientTime: clientTime.toISOString(),
          serverTime: serverTime.toISOString(),
          difference: timeDifference
        });
      } else {
        setSecurityStatus(prev => ({
          ...prev,
          isTimeValid: true,
          lastTimeCheck: clientTime
        }));
      }

    } catch (error) {
      console.error('Erro ao verificar integridade do horário:', error);
    }
  }, []);

  // Detectar uso de DevTools
  const detectDevTools = useCallback(() => {
    let devToolsOpen = false;

    // Método 1: Verificar o tamanho da janela vs viewport
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;

    // Método 2: Verificar console
    let consoleDetected = false;
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: function() {
        consoleDetected = true;
        return 'devtools-detected';
      }
    });
    console.log(element);

    // Método 3: Verificar performance
    const start = performance.now();
    debugger;
    const debuggerTime = performance.now() - start;
    const debuggerDetected = debuggerTime > 100;

    devToolsOpen = widthThreshold || heightThreshold || consoleDetected || debuggerDetected;

    if (devToolsOpen && !securityStatus.isDevToolsDetected) {
      const warningMessage = 'AVISO DE SEGURANÇA: Detectamos o uso de ferramentas de desenvolvedor. O uso dessas ferramentas para burlar o sistema é proibido e pode resultar em suspensão da conta. Por favor, feche as ferramentas de desenvolvedor.';
      
      setSecurityStatus(prev => ({
        ...prev,
        isDevToolsDetected: true,
        warnings: [...prev.warnings, warningMessage]
      }));

      toast.error(warningMessage, {
        duration: 15000,
      });

      // Log da tentativa para auditoria
      console.warn('DevTools detectado - possível tentativa de burla', {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        method: widthThreshold ? 'viewport' : heightThreshold ? 'viewport' : consoleDetected ? 'console' : 'debugger'
      });
    }
  }, [securityStatus.isDevToolsDetected]);

  // Verificar integridade da aplicação
  const checkApplicationIntegrity = useCallback(() => {
    // Verificar se elementos críticos não foram alterados
    const criticalElements = [
      'body',
      '[data-security="protected"]'
    ];

    criticalElements.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        // Adicionar observador de mutação
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' || mutation.type === 'childList') {
              console.warn('Possível tampering detectado:', mutation);
              toast.warning('Sistema de segurança ativo. Alterações não autorizadas foram detectadas.');
            }
          });
        });

        observer.observe(element, {
          attributes: true,
          childList: true,
          subtree: true
        });
      }
    });
  }, []);

  // Hook principal de segurança
  useEffect(() => {
    // Verificação inicial
    checkTimeIntegrity();
    detectDevTools();
    checkApplicationIntegrity();

    // Verificações periódicas
    const timeInterval = setInterval(checkTimeIntegrity, 60000); // A cada minuto
    const devToolsInterval = setInterval(detectDevTools, 5000); // A cada 5 segundos

    // Listeners para eventos de segurança
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detectar F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        toast.warning('Essa ação não é permitida por motivos de segurança.');
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.warning('Click direito desabilitado por motivos de segurança.');
      return false;
    };

    // Adicionar listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    // Cleanup
    return () => {
      clearInterval(timeInterval);
      clearInterval(devToolsInterval);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [checkTimeIntegrity, detectDevTools, checkApplicationIntegrity]);

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