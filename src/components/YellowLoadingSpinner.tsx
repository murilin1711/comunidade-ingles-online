import React from 'react';
import { Loader2 } from 'lucide-react';

interface YellowLoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const YellowLoadingSpinner = ({ 
  message = "Carregando...", 
  size = 'md',
  className = ""
}: YellowLoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-yellow-500`} />
      {message && (
        <p className="text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
};

export default YellowLoadingSpinner;