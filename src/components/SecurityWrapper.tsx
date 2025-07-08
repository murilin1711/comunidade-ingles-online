import React, { useEffect } from 'react';
import { useSecurity } from '@/hooks/useSecurity';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield } from 'lucide-react';

interface SecurityWrapperProps {
  children: React.ReactNode;
  requireSecureTime?: boolean;
  requireNoDevTools?: boolean;
}

const SecurityWrapper: React.FC<SecurityWrapperProps> = ({ 
  children, 
  requireSecureTime = false,
  requireNoDevTools = false 
}) => {
  const { securityStatus, showSecurityWarning } = useSecurity();

  useEffect(() => {
    // Mostrar avisos se houver violações de segurança
    if (securityStatus.warnings.length > 0) {
      showSecurityWarning();
    }
  }, [securityStatus.warnings, showSecurityWarning]);

  // Se houver restrições de segurança ativas, mostrar bloqueio
  const shouldBlock = (requireSecureTime && !securityStatus.isTimeValid) || 
                     (requireNoDevTools && securityStatus.isDevToolsDetected);

  if (shouldBlock) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert className="border-red-500 bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="space-y-2">
                <h3 className="font-semibold">Acesso Bloqueado por Segurança</h3>
                
                {!securityStatus.isTimeValid && (
                  <p className="text-sm">
                    ⚠️ <strong>Horário do Sistema Incorreto:</strong> Detectamos que o horário do seu dispositivo 
                    está incorreto. Corrija o horário nas configurações do seu sistema antes de continuar.
                  </p>
                )}
                
                {securityStatus.isDevToolsDetected && (
                  <p className="text-sm">
                    ⚠️ <strong>Ferramentas de Desenvolvedor Detectadas:</strong> Feche todas as ferramentas 
                    de desenvolvedor (F12, DevTools) antes de continuar.
                  </p>
                )}
                
                <div className="mt-4 p-3 bg-red-100 rounded-lg border border-red-300">
                  <p className="text-sm font-semibold">
                    ⚠️ IMPORTANTE: Tentativas de burlar o sistema podem resultar em:
                  </p>
                  <ul className="text-sm mt-2 space-y-1">
                    <li>• Advertências formais</li>
                    <li>• Suspensão temporária da conta</li>
                    <li>• Bloqueio permanente em casos recorrentes</li>
                  </ul>
                </div>
                
                <p className="text-xs mt-3 text-red-600">
                  Todas as tentativas de burla são registradas e monitoradas pela administração.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Se há avisos mas não bloqueia, mostrar alerta no topo
  if (securityStatus.warnings.length > 0) {
    return (
      <div data-security="protected">
        <Alert className="border-orange-500 bg-orange-50 mb-4">
          <Shield className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Sistema de Segurança Ativo:</strong> Irregularidades detectadas. 
            Certifique-se de estar usando o sistema corretamente.
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  return <div data-security="protected">{children}</div>;
};

export default SecurityWrapper;