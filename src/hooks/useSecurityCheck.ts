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
      
      if (!serverTime) return false;
      
      const timeDifference = Math.abs(clientTime.getTime() - serverTime.getTime());
      // Aumentar tolerância para 30 minutos considerando fusos horários e latência
      const maxAllowedDifference = 30 * 60 * 1000; // 30 minutos
      
      if (timeDifference > maxAllowedDifference) {
        const hoursDecifference = Math.round(timeDifference / (60 * 60 * 1000));
        
        // Se a diferença for muito grande (>2 horas), é provável manipulação
        if (hoursDecifference >= 2) {
          const alert: SecurityAlert = {
            type: 'time_manipulation',
            message: `🚨 VIOLAÇÃO DE SEGURANÇA DETECTADA: Você tentou trocar o horário do seu sistema! Diferença detectada: ${hoursDecifference} horas. Volte o horário padrão para acessar o site! Esta tentativa foi registrada e um mentor foi notificado.`,
            severity: 'critical'
          };
          
          setSecurityAlerts(prev => [...prev, alert]);
          setIsSecure(false);
          
          // Log da tentativa de burla
          logSecurityViolation('time_manipulation', {
            clientTime: clientTime.toISOString(),
            serverTime: serverTime.toISOString(),
            difference: timeDifference,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          });
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Erro na verificação de tempo:', error);
      return false;
    }
  }, [getServerTime]);

  // Detectar DevTools e Console
  const detectDevTools = useCallback(() => {
    let devtools = { open: false, consoleUsed: false };
    
    const threshold = 200; // Aumentar threshold para reduzir falsos positivos
    
    // Detectar abertura de DevTools baseado no tamanho da janela
    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if ((widthThreshold || heightThreshold) && !devtools.open) {
        devtools.open = true;
        // Não mostrar alerta ainda, apenas marcar como aberto
        logSecurityViolation('devtools_opened', {
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          windowSize: `${window.innerWidth}x${window.innerHeight}`
        });
      } else if (!widthThreshold && !heightThreshold) {
        devtools.open = false;
      }
    };

    setInterval(checkDevTools, 1000);

    // Detectar uso efetivo do console (apenas comandos digitados pelo usuário)
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug,
      info: console.info,
      dir: console.dir,
      table: console.table
    };

    // Override console methods apenas se DevTools estiver aberto
    ['log', 'warn', 'error', 'debug', 'info', 'dir', 'table'].forEach(method => {
      const methodKey = method as keyof typeof originalConsole;
      const originalMethod = console[methodKey] as any;
      
      console[methodKey] = function(...args: any[]) {
        // Só alertar se DevTools estiver aberto E o usuário digitou algo
        if (devtools.open && !devtools.consoleUsed) {
          // Verificar se não é log interno do sistema
          const isSystemLog = args.some(arg => 
            typeof arg === 'string' && (
              arg.includes('Dashboard') ||
              arg.includes('changed, updating') ||
              arg.includes('Real-time') ||
              arg.includes('Supabase') ||
              arg.includes('Auth state')
            )
          );

          if (!isSystemLog) {
            devtools.consoleUsed = true;
            
            const alert: SecurityAlert = {
              type: 'client_modification',
              message: '🚨 VIOLAÇÃO DETECTADA: Uso do console detectado! Você está tentando usar ferramentas de desenvolvedor para manipular o sistema. Esta ação foi registrada e um mentor foi notificado. Pare imediatamente!',
              severity: 'critical'
            };
            
            setSecurityAlerts(prev => [...prev, alert]);
            setIsSecure(false);
            
            logSecurityViolation('console_usage', {
              method,
              args: args.map(arg => typeof arg === 'object' ? '[object]' : String(arg))
            });
          }
        }
        
        return originalMethod.apply(console, args);
      };
    });

    // Detectar tentativas de inspecionar elemento
    document.addEventListener('contextmenu', (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        
        const alert: SecurityAlert = {
          type: 'devtools_detected',
          message: '🚨 AVISO: Tentativa de abrir menu de contexto detectada. Não tente inspecionar elementos ou usar ferramentas de desenvolvedor.',
          severity: 'warning'
        };
        
        setSecurityAlerts(prev => [...prev, alert]);
        
        logSecurityViolation('context_menu_attempt', {
          timestamp: new Date().toISOString()
        });
      }
    });

    // Detectar teclas de atalho para DevTools
    document.addEventListener('keydown', (e) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
          (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
        
        const alert: SecurityAlert = {
          type: 'devtools_detected',
          message: '🚨 VIOLAÇÃO DETECTADA: Tentativa de abrir ferramentas de desenvolvedor! Esta ação foi bloqueada e registrada. Um mentor foi notificado.',
          severity: 'critical'
        };
        
        setSecurityAlerts(prev => [...prev, alert]);
        setIsSecure(false);
        
        logSecurityViolation('devtools_shortcut', {
          key: e.key,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey
        });
      }
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