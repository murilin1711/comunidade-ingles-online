import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen = ({ message = "Carregando..." }: LoadingScreenProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-black/20">
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-600" />
          <p className="text-black/80 text-center">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoadingScreen;