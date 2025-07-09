import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';

const CadastroFuncionario = () => {
  const [formData, setFormData] = useState({
    email: '',
    senha: ''
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

  const handleAcesso = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Authenticate using Supabase Auth
      await signIn(formData.email, formData.senha);
      
      // Check if user is admin after authentication
      // This will be handled by the AuthContext and redirect logic
      toast.success('Acesso autorizado!');
    } catch (error: any) {
      console.error('Erro no acesso:', error);
      toast.error('Credenciais inválidas. Acesso negado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-black/20 shadow-lg">
        <CardHeader className="text-center">
          <Logo size="lg" className="mb-4" />
          <CardTitle className="text-2xl text-black">Área Restrita</CardTitle>
          <CardDescription className="text-black/70">
            Acesso exclusivo para funcionários autorizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAcesso} className="space-y-4">
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
              <Label htmlFor="senha" className="text-black">Senha</Label>
              <Input
                id="senha"
                name="senha"
                type="password"
                value={formData.senha}
                onChange={handleChange}
                placeholder="Digite sua senha"
                className="border-black/20 focus:border-yellow-500 focus:ring-yellow-500"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-black hover:bg-black/90 text-yellow-400 font-semibold" 
              disabled={loading}
            >
              {loading ? 'Verificando...' : 'Acessar Sistema de Cadastro'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => navigate('/login')}
              className="text-sm text-black hover:text-black/80"
            >
              Voltar ao login
            </Button>
          </div>
          
          <div className="mt-6 p-3 bg-yellow-100 border border-black/20 rounded-md">
            <p className="text-xs text-black/80">
              <strong>Atenção:</strong> Esta área é restrita a funcionários autorizados. 
              O acesso não autorizado é proibido.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CadastroFuncionario;
