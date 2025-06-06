
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

const Cadastro = () => {
  const [formData, setFormData] = useState({
    matricula: '',
    nome: '',
    email: '',
    tipoUsuario: 'aluno' as 'aluno' | 'professor'
  });
  const [loading, setLoading] = useState(false);
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
    
    if (!formData.email || !formData.matricula || !formData.nome) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    if (formData.matricula.length < 6) {
      toast.error('A matrícula deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      // 1. Criar usuário no Supabase Auth usando email e matrícula como senha
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.matricula
      });

      if (authError) {
        console.error('Erro no Auth SignUp:', authError);
        toast.error(`Não foi possível criar usuário: ${authError.message}`);
        return;
      }

      if (!authData.user) {
        toast.error('Não foi possível criar usuário: Falha na criação');
        return;
      }

      console.log('Usuário criado no Auth com ID:', authData.user.id);

      // 2. Criar registro na tabela correspondente usando o ID do Auth
      const userData = {
        id: authData.user.id,
        matricula: formData.matricula,
        nome: formData.nome,
        email: formData.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (formData.tipoUsuario === 'aluno') {
        const { error: alunoError } = await supabase
          .from('alunos')
          .insert({
            ...userData,
            status: 'ativo'
          });
        
        if (alunoError) {
          console.error('Erro ao criar aluno:', alunoError);
          // Remover do Auth se falhar na tabela
          await supabase.auth.admin.deleteUser(authData.user.id);
          
          if (alunoError.code === '23505') {
            toast.error('E-mail ou matrícula já cadastrado.');
          } else {
            toast.error('Erro ao finalizar cadastro');
          }
          return;
        }
      } else {
        const { error: professorError } = await supabase
          .from('professores')
          .insert(userData);
        
        if (professorError) {
          console.error('Erro ao criar professor:', professorError);
          // Remover do Auth se falhar na tabela
          await supabase.auth.admin.deleteUser(authData.user.id);
          
          if (professorError.code === '23505') {
            toast.error('E-mail ou matrícula já cadastrado.');
          } else {
            toast.error('Erro ao finalizar cadastro');
          }
          return;
        }
      }

      toast.success(`Conta de ${formData.tipoUsuario} criada com sucesso!`);
      toast.success(`Login: ${formData.email} | Senha: ${formData.matricula}`);
      
      // Fazer login automático após o cadastro
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.matricula
      });

      if (!loginError) {
        // Redirecionar baseado no tipo de usuário
        if (formData.tipoUsuario === 'aluno') {
          navigate('/dashboard-aluno');
        } else {
          navigate('/dashboard-professor');
        }
      } else {
        console.error('Erro no login automático:', loginError);
        navigate('/login');
      }
      
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      toast.error('Erro no cadastro. Tente novamente.');
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
                minLength={6}
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
