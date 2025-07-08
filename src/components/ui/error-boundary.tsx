import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorId: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    return { 
      hasError: true, 
      error,
      errorId 
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    };

    // Log detalhado do erro
    console.error('ErrorBoundary capturou um erro:', errorDetails);

    // Chamar callback personalizado se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Mostrar toast de erro
    toast.error(
      'Ocorreu um erro inesperado. Nossa equipe foi notificada. ID do erro: ' + this.state.errorId,
      { duration: 8000 }
    );

    // Em produção, você poderia enviar este erro para um serviço de monitoramento
    // como Sentry, LogRocket, etc.
    this.reportError(errorDetails);
  }

  private reportError = async (errorDetails: any) => {
    try {
      // Aqui você poderia enviar o erro para um serviço de logging
      // Por enquanto, apenas logamos no console
      console.warn('Erro reportado:', errorDetails);
      
      // Em uma implementação real, você faria algo como:
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   body: JSON.stringify(errorDetails)
      // });
    } catch (reportingError) {
      console.error('Falha ao reportar erro:', reportingError);
    }
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: '' });
    toast.success('Tentando novamente...');
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg border-red-200">
            <CardHeader className="text-center">
              <AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <CardTitle className="text-black text-xl">
                Ops! Algo deu errado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-black/70 mb-3">
                  Encontramos um erro inesperado. Nossa equipe técnica foi automaticamente notificada 
                  e está trabalhando para resolver o problema.
                </p>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-700">
                    <strong>ID do Erro:</strong> {this.state.errorId}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Use este ID ao entrar em contato com o suporte técnico.
                  </p>
                </div>
              </div>
              
              {this.state.error && (
                <details className="text-left">
                  <summary className="text-sm text-black/60 cursor-pointer mb-2 font-medium">
                    Detalhes técnicos (clique para expandir)
                  </summary>
                  <div className="bg-gray-100 p-3 rounded text-xs text-gray-700 font-mono max-h-32 overflow-auto">
                    <div><strong>Erro:</strong> {this.state.error.message}</div>
                    {this.state.error.stack && (
                      <div className="mt-2">
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap text-xs">
                          {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={this.handleRetry}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="border-black/30 text-black hover:bg-yellow-50"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Voltar ao Início
                </Button>
              </div>

              <div className="text-center mt-4">
                <p className="text-xs text-black/50">
                  Se o problema persistir, entre em contato com o suporte técnico informando o ID do erro acima.
                </p>
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