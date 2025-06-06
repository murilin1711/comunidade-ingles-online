
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import Logo from '@/components/Logo';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    matricula: ''
  });
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.matricula) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    setLoading(true);

    try {
      // Usar a matrícula como senha no processo de login
      await signIn(formData.email, formData.matricula);
      toast.success('Login realizado com sucesso!');
      // O redirecionamento será feito automaticamente pelo AuthContext
    } catch (error: any) {
      console.error('Erro no login:', error);
      
      if (error.message?.includes('Invalid login credentials')) {
        toast.error('Email ou matrícula incorretos');
      } else if (error.message?.includes('não está cadastrado')) {
        toast.error('Usuário não está cadastrado no sistema');
      } else {
        toast.error('Erro no login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-black/20 shadow-lg">
        <CardHeader className="text-center">
          <Logo size="lg" className="mb-4" />
          <CardTitle className="text-2xl text-black">Login</CardTitle>
          <CardDescription className="text-black/70">
            Entre com seu email e matrícula
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-black">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Digite seu email"
                className="border-black/20 focus:border-yellow-500 focus:ring-yellow-500"
                required
              />
            </div>
            <div>
              <Label htmlFor="matricula" className="text-black">Matrícula</Label>
              <Input
                id="matricula"
                name="matricula"
                type="password"
                value={formData.matricula}
                onChange={handleChange}
                placeholder="Digite sua matrícula"
                className="border-black/20 focus:border-yellow-500 focus:ring-yellow-500"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold" 
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          
          <div className="mt-6 space-y-2">
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => navigate('/cadastro-funcionario')}
                className="w-full border-black/30 text-black hover:bg-yellow-50"
              >
                Acesso para Funcionários
              </Button>
            </div>
            <div className="text-center">
              <p className="text-xs text-black/60">
                Área restrita para criação de novas contas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
