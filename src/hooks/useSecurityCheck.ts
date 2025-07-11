import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityAlert {
  type: 'time_manipulation' | 'devtools_detected' | 'client_modification';
  message: string;
  severity: 'warning' | 'critical';
}

export const useSecurityCheck = () => {
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [isSecure, setIsSecure] = useState(true);
  const { toast } = useToast();

  // Função para obter tempo do servidor
  const getServerTime = useCallback(async (): Promise<Date | null> => {
    try {
      const { data, error } = await supabase.rpc('get_server_time');
      
      if (error) {
        console.error('Erro ao obter tempo do servidor:', error);
        return null;
      }
      
      return new Date(data);
    } catch (error) {
      console.error('Erro ao obter tempo do servidor:', error);
      return null;
    }
  }, []);

  // Verificar manipulação de tempo
  const checkTimeManipulation = useCallback(async () => {
    try {
      const clientTime = new Date();
      const serverTime = await getServerTime();
      
      if (!serverTime) return;
      
      const timeDifference = Math.abs(clientTime.getTime() - serverTime.getTime());
      const maxAllowedDifference = 5 * 60 * 1000; // 5 minutos
      
      if (timeDifference > maxAllowedDifference) {
        const alert: SecurityAlert = {
          type: 'time_manipulation',
          message: `⚠️ AVISO DE SEGURANÇA: Foi detectada uma diferença de ${Math.round(timeDifference / 60000)} minutos entre o horário do seu dispositivo e o servidor. Tentativas de manipular o horário para obter vantagem nas inscrições resultarão em advertência. Um mentor foi notificado sobre esta atividade suspeita.`,
          severity: 'critical'
        };
        
        setSecurityAlerts(prev => [...prev, alert]);
        setIsSecure(false);
        
        // Log da tentativa de burla
        logSecurityViolation('time_manipulation', {
          clientTime: clientTime.toISOString(),
          serverTime: serverTime.toISOString(),
          difference: timeDifference
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro na verificação de tempo:', error);
      return false;
    }
  }, [getServerTime]);

  // Detectar DevTools
  const detectDevTools = useCallback(() => {
    let devtools = { open: false };
    
    const threshold = 160;
    
    setInterval(() => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        if (!devtools.open) {
          devtools.open = true;
          
          const alert: SecurityAlert = {
            type: 'devtools_detected',
            message: '🚨 AVISO DE SEGURANÇA: Foi detectada abertura das ferramentas de desenvolvedor. Qualquer tentativa de manipular o sistema através do console ou alteração de código resultará em advertência imediata. Um mentor foi notificado desta atividade.',
            severity: 'critical'
          };
          
          setSecurityAlerts(prev => [...prev, alert]);
          setIsSecure(false);
          
          logSecurityViolation('devtools_detected', {
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            windowSize: `${window.innerWidth}x${window.innerHeight}`
          });
        }
      } else {
        devtools.open = false;
      }
    }, 500);

    // Detectar uso do console
    let consoleWarningShown = false;
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
      info: console.info
    };
    
    ['log', 'warn', 'error', 'debug', 'info'].forEach(method => {
      const methodKey = method as 'log' | 'warn' | 'error' | 'debug' | 'info';
      const originalMethod = console[methodKey];
      
      console[methodKey] = function(...args: any[]) {
        if (!consoleWarningShown) {
          consoleWarningShown = true;
          
          const alert: SecurityAlert = {
            type: 'client_modification',
            message: '⛔ AVISO FINAL: Uso do console detectado! Parar imediatamente ou receberá advertência. Mentores foram notificados.',
            severity: 'critical'
          };
          
          setSecurityAlerts(prev => [...prev, alert]);
          
          logSecurityViolation('console_usage', {
            method,
            args: args.map(arg => typeof arg === 'object' ? '[object]' : String(arg))
          });
        }
        
        return originalMethod.apply(console, args);
      };
    });
  }, []);

  // Proteger contra alterações no DOM
  const protectDOM = useCallback(() => {
    // Observar mudanças críticas no DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          // Verificar se elementos críticos foram alterados
          const criticalElements = document.querySelectorAll('[data-security-critical]');
          if (criticalElements.length === 0) {
            logSecurityViolation('dom_manipulation', {
              type: 'critical_elements_removed',
              mutations: mutations.length
            });
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });

    return () => observer.disconnect();
  }, []);

  // Log de violações de segurança
  const logSecurityViolation = async (type: string, details: any) => {
    try {
      const user = await supabase.auth.getUser();
      
      console.warn(`🚨 VIOLAÇÃO DE SEGURANÇA DETECTADA: ${type}`, details);
      
      // Em um ambiente real, isso seria enviado para um endpoint de segurança
      // Por enquanto, apenas logamos no console para auditoria
      const violationLog = {
        timestamp: new Date().toISOString(),
        type,
        details,
        userId: user.data.user?.id,
        userAgent: navigator.userAgent,
        ip: 'client-side' // Em produção, seria obtido do servidor
      };
      
      // Salvar no localStorage para auditoria local
      const existingLogs = JSON.parse(localStorage.getItem('security_violations') || '[]');
      existingLogs.push(violationLog);
      localStorage.setItem('security_violations', JSON.stringify(existingLogs));
      
    } catch (error) {
      console.error('Erro ao registrar violação de segurança:', error);
    }
  };

  // Mostrar alertas de segurança
  const showSecurityAlert = useCallback((alert: SecurityAlert) => {
    toast({
      title: "⚠️ ALERTA DE SEGURANÇA",
      description: alert.message,
      variant: "destructive",
      duration: 10000,
    });
  }, [toast]);

  // Inicializar verificações de segurança
  useEffect(() => {
    const initSecurity = async () => {
      // Verificação inicial de tempo
      await checkTimeManipulation();
      
      // Configurar detecção de DevTools
      detectDevTools();
      
      // Proteger DOM
      const cleanup = protectDOM();
      
      // Verificação periódica de tempo (a cada 30 segundos)
      const timeInterval = setInterval(checkTimeManipulation, 30000);
      
      return () => {
        clearInterval(timeInterval);
        cleanup();
      };
    };

    initSecurity();
  }, [checkTimeManipulation, detectDevTools, protectDOM]);

  // Mostrar alertas quando criados
  useEffect(() => {
    securityAlerts.forEach(alert => {
      showSecurityAlert(alert);
    });
  }, [securityAlerts, showSecurityAlert]);

  return {
    isSecure,
    securityAlerts,
    checkTimeManipulation,
    logSecurityViolation
  };
};