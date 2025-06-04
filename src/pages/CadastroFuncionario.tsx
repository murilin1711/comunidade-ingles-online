import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from '@/components/ui/sonner';
import Logo from '@/components/Logo';

const CadastroFuncionario = () => {
  const [senhaFuncionario, setSenhaFuncionario] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Senha fixa para funcionários (em produção, isso deveria vir de uma fonte segura)
  const SENHA_FUNCIONARIO = '@Comunidade1%1090';

  const handleAcesso = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      if (senhaFuncionario === SENHA_FUNCIONARIO) {
        toast.success('Acesso autorizado!');
        navigate('/cadastro');
      } else {
        toast.error('Senha incorreta. Acesso negado.');
      }
      setLoading(false);
    }, 1000);
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
              <Label htmlFor="senhaFuncionario" className="text-black">Senha de Funcionário</Label>
              <Input
                id="senhaFuncionario"
                type="password"
                value={senhaFuncionario}
                onChange={(e) => setSenhaFuncionario(e.target.value)}
                placeholder="Digite a senha de funcionário"
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
