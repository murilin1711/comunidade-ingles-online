import React, { useEffect } from 'react';
import { useSecurity } from '@/hooks/useSecurity';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface SecurityGuardProps {
  children: React.ReactNode;
}

const SecurityGuard: React.FC<SecurityGuardProps> = ({ children }) => {
  const { securityStatus } = useSecurity();
  const { handleWarning } = useErrorHandler();

  useEffect(() => {
    // Verificações de integridade do sistema
    const checkSystemIntegrity = () => {
      // Verificar se as configurações básicas do navegador não foram alteradas
      if (typeof window.console.log !== 'function') {
        handleWarning('Sistema modificado detectado. Recarregue a página.');
      }

      // Verificar se elementos críticos da página existem
      const body = document.querySelector('body');
      if (!body) {
        handleWarning('Estrutura da página comprometida.');
      }

      // Verificar se jQuery ou bibliotecas externas foram injetadas
      if ((window as any).jQuery || (window as any).$) {
        console.warn('Bibliotecas externas detectadas');
      }
    };

    // Executar verificação inicial
    checkSystemIntegrity();

    // Verificação periódica
    const interval = setInterval(checkSystemIntegrity, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, [handleWarning]);

  // Detectar tentativas de injeção de scripts
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // Detectar scripts externos não autorizados
              if (element.tagName === 'SCRIPT' && 
                  !element.getAttribute('src')?.includes('lovable.app') &&
                  !element.getAttribute('src')?.includes('supabase')) {
                console.warn('Script externo detectado:', element);
                handleWarning('Atividade suspeita detectada no sistema.');
              }
              
              // Detectar iframes suspeitos
              if (element.tagName === 'IFRAME') {
                console.warn('Iframe detectado:', element);
              }
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [handleWarning]);

  return <>{children}</>;
};

export default SecurityGuard;