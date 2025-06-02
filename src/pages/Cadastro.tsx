
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { auth, db } from '@/lib/firebase';
import { toast } from '@/components/ui/sonner';

const Cadastro = () => {
  const [formData, setFormData] = useState({
    matricula: '',
    nome: '',
    emailWhatsApp: '',
    telegramChatId: '',
    senha: '',
    confirmarSenha: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
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
      
      // Criar documento do aluno no Firestore
      await setDoc(doc(db, 'alunos', userCredential.user.uid), {
        matricula: formData.matricula,
        nome: formData.nome,
        emailWhatsApp: formData.emailWhatsApp,
        telegramChatId: formData.telegramChatId,
        role: 'aluno',
        statusSuspenso: false,
        fimSuspensao: null
      });

      toast.success('Cadastro realizado com sucesso!');
      navigate('/dashboard-aluno');
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
          <CardTitle className="text-2xl">Cadastro</CardTitle>
          <CardDescription>
            Crie sua conta de aluno
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCadastro} className="space-y-4">
            <div>
              <Label htmlFor="matricula">Matrícula</Label>
              <Input
                id="matricula"
                name="matricula"
                type="text"
                value={formData.matricula}
                onChange={handleChange}
                placeholder="Digite sua matrícula"
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
                placeholder="Digite seu nome completo"
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
                placeholder="Digite seu email ou WhatsApp"
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
                placeholder="Digite seu Chat ID do Telegram"
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
                placeholder="Digite sua senha (min. 6 caracteres)"
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
                placeholder="Confirme sua senha"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => navigate('/login')}
              className="text-sm"
            >
              Já tem conta? Faça login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Cadastro;
