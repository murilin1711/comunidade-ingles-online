import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from '@/components/ui/sonner';

import Logo from '@/components/Logo';

const CadastroFuncionario = () => {
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const SENHA_ACESSO = '@Comunidade1%1090';

  const handleAcesso = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (senha === SENHA_ACESSO) {
        toast.success('Acesso autorizado! Redirecionando para área de cadastro...');
        setTimeout(() => {
          navigate('/cadastro');
        }, 1000);
      } else {
        toast.error('Senha incorreta. Acesso negado.');
      }
    } catch (error: any) {
      console.error('Erro no acesso:', error);
      toast.error('Erro ao verificar acesso.');
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
            Para criar contas de alunos, professores e administradores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAcesso} className="space-y-4">
            <div>
              <Label htmlFor="senha" className="text-black">Senha de Acesso</Label>
              <Input
                id="senha"
                name="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite a senha de acesso"
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
              <strong>Atenção:</strong> Esta área permite a criação de novas contas no sistema. 
              Acesso restrito a funcionários autorizados.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CadastroFuncionario;
