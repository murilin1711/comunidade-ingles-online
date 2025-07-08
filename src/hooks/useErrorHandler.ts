import { useCallback } from 'react';
import { toast } from '@/components/ui/sonner';

export interface ErrorDetails {
  code?: string;
  message: string;
  context?: string;
  timestamp?: Date;
  userAction?: string;
}

const ERROR_MESSAGES = {
  // Erros de rede
  'NetworkError': 'Erro de conexão. Verifique sua internet e tente novamente.',
  'fetch_failed': 'Falha na comunicação com o servidor. Tente novamente em alguns instantes.',
  
  // Erros de banco de dados
  '23505': 'Registro duplicado. Esta ação já foi realizada.',
  '23503': 'Não é possível realizar esta ação. Existem dependências que impedem a operação.',
  '42501': 'Permissão negada. Você não tem autorização para esta ação.',
  
  // Erros específicos do sistema
  'already_registered': 'Você já está inscrito nesta aula.',
  'class_full': 'Esta aula está lotada. Você foi adicionado à lista de espera.',
  'registration_closed': 'O período de inscrições está fechado.',
  'student_suspended': 'Sua conta está suspensa. Entre em contato com a administração.',
  'invalid_time': 'Horário inválido detectado. Corrija o horário do seu dispositivo.',
  
  // Erros de autenticação
  'auth_required': 'É necessário fazer login para continuar.',
  'session_expired': 'Sua sessão expirou. Faça login novamente.',
  'invalid_credentials': 'Email ou senha incorretos.',
  
  // Erros de validação
  'validation_error': 'Dados inválidos. Verifique as informações e tente novamente.',
  'required_field': 'Todos os campos obrigatórios devem ser preenchidos.',
  
  // Erro genérico
  'unknown': 'Erro inesperado. Tente novamente ou entre em contato com o suporte.'
};

export const useErrorHandler = () => {
  const logError = useCallback((error: any, context?: string) => {
    const errorDetails: ErrorDetails = {
      code: error.code || error.name,
      message: error.message || 'Erro desconhecido',
      context: context || 'unknown',
      timestamp: new Date(),
      userAction: context
    };

    console.error('Erro capturado:', errorDetails);
    
    // Em produção, você enviaria para um serviço de logging
    // sendToLoggingService(errorDetails);
  }, []);

  const getErrorMessage = useCallback((error: any): string => {
    // Se é um erro conhecido do Supabase
    if (error.code && ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES]) {
      return ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES];
    }

    // Se é um erro com mensagem específica conhecida
    if (error.message) {
      const message = error.message.toLowerCase();
      
      if (message.includes('já possui inscrição em aula nesta semana')) {
        return 'Você já possui uma inscrição nesta semana. Apenas uma inscrição por semana é permitida.';
      }
      
      if (message.includes('network')) {
        return ERROR_MESSAGES.NetworkError;
      }
      
      if (message.includes('fetch')) {
        return ERROR_MESSAGES.fetch_failed;
      }
      
      if (message.includes('permission') || message.includes('unauthorized')) {
        return ERROR_MESSAGES['42501'];
      }
    }

    return ERROR_MESSAGES.unknown;
  }, []);

  const handleError = useCallback((error: any, context?: string, showToast = true) => {
    logError(error, context);
    
    const userFriendlyMessage = getErrorMessage(error);
    
    if (showToast) {
      toast.error(userFriendlyMessage, {
        duration: 5000,
        description: context ? `Contexto: ${context}` : undefined
      });
    }
    
    return userFriendlyMessage;
  }, [logError, getErrorMessage]);

  const handleSuccess = useCallback((message: string, description?: string) => {
    toast.success(message, {
      description,
      duration: 3000
    });
  }, []);

  const handleWarning = useCallback((message: string, description?: string) => {
    toast.warning(message, {
      description,
      duration: 4000
    });
  }, []);

  const handleInfo = useCallback((message: string, description?: string) => {
    toast.info(message, {
      description,
      duration: 3000
    });
  }, []);

  return {
    handleError,
    handleSuccess,
    handleWarning,
    handleInfo,
    getErrorMessage,
    logError
  };
};