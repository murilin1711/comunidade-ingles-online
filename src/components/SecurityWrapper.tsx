import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle } from 'lucide-react';

interface SecurityWrapperProps {
  children: React.ReactNode;
  onTamperDetected?: () => void;
}

export const SecurityWrapper: React.FC<SecurityWrapperProps> = ({ 
  children, 
  onTamperDetected 
}) => {
  const [isTampered, setIsTampered] = useState(false);
  const [checksum, setChecksum] = useState<string>('');

  useEffect(() => {
    // Gerar checksum inicial do componente
    const generateChecksum = () => {
      const content = document.querySelector('[data-security-wrapper]')?.innerHTML || '';
      let hash = 0;
      for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return hash.toString(16);
    };

    const initialChecksum = generateChecksum();
    setChecksum(initialChecksum);

    // Verificar integridade periodicamente
    const interval = setInterval(() => {
      const currentChecksum = generateChecksum();
      if (currentChecksum !== initialChecksum && currentChecksum !== checksum) {
        setIsTampered(true);
        onTamperDetected?.();
        
        console.warn('🚨 MANIPULAÇÃO DETECTADA: Componente foi alterado!');
        
        // Log da violação
        const violation = {
          type: 'component_tampering',
          timestamp: new Date().toISOString(),
          originalChecksum: initialChecksum,
          currentChecksum: currentChecksum,
          location: window.location.href
        };
        
        const existingLogs = JSON.parse(localStorage.getItem('security_violations') || '[]');
        existingLogs.push(violation);
        localStorage.setItem('security_violations', JSON.stringify(existingLogs));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [checksum, onTamperDetected]);

  if (isTampered) {
    return (
      <div className="p-4">
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            🚨 MANIPULAÇÃO DETECTADA: O sistema foi comprometido. 
            Recarregue a página e evite usar ferramentas de desenvolvedor. 
            Mentores foram notificados desta atividade suspeita.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div data-security-wrapper data-security-critical>
      {children}
    </div>
  );
};