import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface YellowLoadingSpinnerProps {
  show: boolean;
  delay?: number; // em millisegundos, padrão 2000ms (2 segundos)
}

const YellowLoadingSpinner = ({ show, delay = 2000 }: YellowLoadingSpinnerProps) => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (show) {
      timer = setTimeout(() => {
        setShouldShow(true);
      }, delay);
    } else {
      setShouldShow(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [show, delay]);

  if (!shouldShow) return null;

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
        <p className="text-black/80 text-center">Carregando...</p>
      </div>
    </div>
  );
};

export default YellowLoadingSpinner;
export { YellowLoadingSpinner };