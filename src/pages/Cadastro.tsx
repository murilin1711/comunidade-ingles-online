
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';

const Cadastro = () => {
  const [formData, setFormData] = useState({
    matricula: '',
    nome: '',
    email: '',
    telefone: '',
    tipoUsuario: 'aluno' as 'aluno' | 'professor'
  });
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTipoUsuarioChange = (value: string) => {
    setFormData({
      ...formData,
      tipoUsuario: value as 'aluno' | 'professor'
    });
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.matricula || !formData.nome || !formData.telefone) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    setLoading(true);

    try {
      console.log('Creating user with data:', formData);
      
      // Use matrícula as password for Supabase Auth
      await signUp(formData.email, formData.matricula, {
        matricula: formData.matricula,
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        role: formData.tipoUsuario
      });

      toast.success(`Conta de ${formData.tipoUsuario} criada com sucesso!`);
      toast.success(`Login: ${formData.email} | Senha: ${formData.matricula}`);
      
      // Note: The user will be automatically redirected by the App component
      // based on their role once authentication is complete
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      
      let errorMessage = 'Erro no cadastro. Tente novamente.';
      
      if (error.message?.includes('User already registered')) {
        errorMessage = 'Este email já está cadastrado';
      } else if (error.message?.includes('Password should be at least 6 characters')) {
        errorMessage = 'A matrícula deve ter pelo menos 6 caracteres';
      } else if (error.message?.includes('Unable to validate email address')) {
        errorMessage = 'Email inválido';
      } else if (error.message?.includes('duplicate key value violates unique constraint')) {
        if (error.message.includes('matricula')) {
          errorMessage = 'Esta matrícula já está cadastrada';
        } else if (error.message.includes('email')) {
          errorMessage = 'Este email já está cadastrado';
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-black/20 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-black">Cadastro de Usuário</CardTitle>
          <CardDescription className="text-black/70">
            Área restrita para funcionários - Criar nova conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCadastro} className="space-y-4">
            <div>
              <Label htmlFor="tipoUsuario" className="text-black">Tipo de Usuário</Label>
              <RadioGroup 
                value={formData.tipoUsuario} 
                onValueChange={handleTipoUsuarioChange}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="aluno" id="aluno" />
                  <Label htmlFor="aluno" className="text-black">Aluno</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="professor" id="professor" />
                  <Label htmlFor="professor" className="text-black">Mentor/Professor</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <Label htmlFor="matricula" className="text-black">
                {formData.tipoUsuario === 'aluno' ? 'Matrícula' : 'ID Funcionário'}
              </Label>
              <Input
                id="matricula"
                name="matricula"
                type="text"
                value={formData.matricula}
                onChange={handleChange}
                placeholder={formData.tipoUsuario === 'aluno' ? 'Digite a matrícula' : 'Digite o ID do funcionário'}
                className="border-black/20 focus:border-yellow-500 focus:ring-yellow-500"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="nome" className="text-black">Nome Completo</Label>
              <Input
                id="nome"
                name="nome"
                type="text"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Digite o nome completo"
                className="border-black/20 focus:border-yellow-500 focus:ring-yellow-500"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="text-black">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Digite o email"
                className="border-black/20 focus:border-yellow-500 focus:ring-yellow-500"
                required
              />
            </div>

            <div>
              <Label htmlFor="telefone" className="text-black">Telefone</Label>
              <Input
                id="telefone"
                name="telefone"
                type="tel"
                value={formData.telefone}
                onChange={handleChange}
                placeholder="Digite o telefone"
                className="border-black/20 focus:border-yellow-500 focus:ring-yellow-500"
                required
              />
            </div>
            
            <div className="mt-4 p-3 bg-yellow-100 border border-black/20 rounded-md">
              <p className="text-xs text-black/80">
                <strong>Informação:</strong> A senha para login será a matrícula/ID informada acima.
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-black hover:bg-black/90 text-yellow-400 font-semibold" 
              disabled={loading}
            >
              {loading ? 'Criando conta...' : `Criar conta de ${formData.tipoUsuario}`}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Cadastro;
