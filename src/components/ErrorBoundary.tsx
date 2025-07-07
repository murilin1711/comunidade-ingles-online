import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-red-200">
            <CardHeader className="text-center">
              <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
              <CardTitle className="text-black">Algo deu errado</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-black/60">
                Ocorreu um erro inesperado. Por favor, tente recarregar a página.
              </p>
              
              {this.state.error && (
                <details className="text-left">
                  <summary className="text-sm text-black/60 cursor-pointer mb-2">
                    Detalhes do erro
                  </summary>
                  <div className="bg-gray-100 p-3 rounded text-xs text-gray-700 font-mono">
                    {this.state.error.message}
                  </div>
                </details>
              )}

              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={this.handleRetry}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
                
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="border-black/30 text-black"
                >
                  Recarregar Página
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;