
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoadingScreen from "@/components/LoadingScreen";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import CadastroFuncionario from "./pages/CadastroFuncionario";
import DashboardAluno from "./pages/DashboardAluno";
import DashboardProfessor from "./pages/DashboardProfessor";
import DashboardAdmin from "./pages/DashboardAdmin";
import AgendamentoAulas from "./pages/AgendamentoAulas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode, requiredRole?: string }) => {
  const { user, userData, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen message="Verificando autenticação..." />;
  }
  
  if (!user || !userData) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && userData.role !== requiredRole) {
    // Redirecionar para o dashboard apropriado se o usuário tem role diferente
    const redirectPath = userData.role === 'admin' ? '/dashboard-admin' :
                        userData.role === 'aluno' ? '/dashboard-aluno' : '/dashboard-professor';
    return <Navigate to={redirectPath} replace />;
  }
  
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, userData, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen message="Carregando..." />;
  }
  
  if (user && userData) {
    // Redirecionar baseado no tipo de usuário
    const redirectPath = userData.role === 'admin' ? '/dashboard-admin' : 
                        userData.role === 'aluno' ? '/dashboard-aluno' : '/dashboard-professor';
    return <Navigate to={redirectPath} replace />;
  }
  
  return <>{children}</>;
};

const AppContent = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/cadastro-funcionario" element={
        <PublicRoute>
          <CadastroFuncionario />
        </PublicRoute>
      } />
      <Route path="/cadastro" element={
        <PublicRoute>
          <Cadastro />
        </PublicRoute>
      } />
      <Route path="/dashboard-aluno" element={
        <ProtectedRoute requiredRole="aluno">
          <ErrorBoundary>
            <DashboardAluno />
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      <Route path="/dashboard-professor" element={
        <ProtectedRoute requiredRole="professor">
          <ErrorBoundary>
            <DashboardProfessor />
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      <Route path="/dashboard-admin" element={
        <ProtectedRoute requiredRole="admin">
          <ErrorBoundary>
            <DashboardAdmin />
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      <Route path="/agendamento" element={
        <ProtectedRoute requiredRole="aluno">
          <ErrorBoundary>
            <AgendamentoAulas />
          </ErrorBoundary>
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
