
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { auth, db } from '@/lib/firebase';
import { toast } from '@/components/ui/sonner';

const Cadastro = () => {
  const [formData, setFormData] = useState({
    matricula: '',
    nome: '',
    emailWhatsApp: '',
    telegramChatId: '',
    senha: '',
    confirmarSenha: '',
    tipoUsuario: 'aluno'
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
      tipoUsuario: value
    });
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.senha !== formData.confirmarSenha) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (formData.senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const email = `${formData.matricula}@comunidade.app`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, formData.senha);
      
      // Criar documento do usuário no Firestore baseado no tipo
      const userData = {
        matricula: formData.matricula,
        nome: formData.nome,
        emailWhatsApp: formData.emailWhatsApp,
        telegramChatId: formData.telegramChatId,
        role: formData.tipoUsuario,
        criadoEm: new Date(),
        criadoPor: 'funcionario' // Indica que foi criado por um funcionário
      };

      if (formData.tipoUsuario === 'aluno') {
        await setDoc(doc(db, 'alunos', userCredential.user.uid), {
          ...userData,
          statusSuspenso: false,
          fimSuspensao: null
        });
      } else {
        await setDoc(doc(db, 'professores', userCredential.user.uid), userData);
      }

      toast.success(`Conta de ${formData.tipoUsuario} criada com sucesso!`);
      
      // Redirecionar baseado no tipo de usuário
      if (formData.tipoUsuario === 'aluno') {
        navigate('/dashboard-aluno');
      } else {
        navigate('/dashboard-professor');
      }
    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Esta matrícula já está cadastrada');
      } else {
        toast.error('Erro no cadastro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Cadastro de Usuário</CardTitle>
          <CardDescription>
            Área restrita para funcionários - Criar nova conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCadastro} className="space-y-4">
            <div>
              <Label htmlFor="tipoUsuario">Tipo de Usuário</Label>
              <RadioGroup 
                value={formData.tipoUsuario} 
                onValueChange={handleTipoUsuarioChange}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="aluno" id="aluno" />
                  <Label htmlFor="aluno">Aluno</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="professor" id="professor" />
                  <Label htmlFor="professor">Mentor/Professor</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <Label htmlFor="matricula">
                {formData.tipoUsuario === 'aluno' ? 'Matrícula' : 'ID Funcionário'}
              </Label>
              <Input
                id="matricula"
                name="matricula"
                type="text"
                value={formData.matricula}
                onChange={handleChange}
                placeholder={formData.tipoUsuario === 'aluno' ? 'Digite a matrícula' : 'Digite o ID do funcionário'}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                name="nome"
                type="text"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Digite o nome completo"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="emailWhatsApp">Email/WhatsApp</Label>
              <Input
                id="emailWhatsApp"
                name="emailWhatsApp"
                type="email"
                value={formData.emailWhatsApp}
                onChange={handleChange}
                placeholder="Digite o email ou WhatsApp"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="telegramChatId">Telegram Chat ID</Label>
              <Input
                id="telegramChatId"
                name="telegramChatId"
                type="text"
                value={formData.telegramChatId}
                onChange={handleChange}
                placeholder="Digite o Chat ID do Telegram"
              />
            </div>
            
            <div>
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                name="senha"
                type="password"
                value={formData.senha}
                onChange={handleChange}
                placeholder="Digite a senha (min. 6 caracteres)"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
              <Input
                id="confirmarSenha"
                name="confirmarSenha"
                type="password"
                value={formData.confirmarSenha}
                onChange={handleChange}
                placeholder="Confirme a senha"
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Criando conta...' : `Criar conta de ${formData.tipoUsuario}`}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Cadastro;
