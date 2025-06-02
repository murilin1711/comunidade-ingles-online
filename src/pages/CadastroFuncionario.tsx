
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from '@/components/ui/sonner';

const CadastroFuncionario = () => {
  const [senhaFuncionario, setSenhaFuncionario] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Senha fixa para funcionários (em produção, isso deveria vir de uma fonte segura)
  const SENHA_FUNCIONARIO = 'admin123';

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
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-red-600">Área Restrita</CardTitle>
          <CardDescription>
            Acesso exclusivo para funcionários autorizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAcesso} className="space-y-4">
            <div>
              <Label htmlFor="senhaFuncionario">Senha de Funcionário</Label>
              <Input
                id="senhaFuncionario"
                type="password"
                value={senhaFuncionario}
                onChange={(e) => setSenhaFuncionario(e.target.value)}
                placeholder="Digite a senha de funcionário"
                required
              />
            </div>
            
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
              {loading ? 'Verificando...' : 'Acessar Sistema de Cadastro'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => navigate('/login')}
              className="text-sm"
            >
              Voltar ao login
            </Button>
          </div>
          
          <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-800">
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
