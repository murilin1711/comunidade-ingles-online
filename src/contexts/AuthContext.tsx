
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserData {
  matricula: string;
  nome: string;
  email: string;
  role: 'aluno' | 'professor';
  statusSuspenso?: boolean;
  fimSuspensao?: Date | null;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: { nome: string; matricula: string; role: 'aluno' | 'professor' }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Configurar listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Verificar se existe registro na tabela correspondente
          await validateUserInDatabase(session.user);
        } else {
          setUserData(null);
        }
        
        setLoading(false);
      }
    );

    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user);
      setUser(session?.user ?? null);
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const validateUserInDatabase = async (authUser: User) => {
    try {
      // Tentar buscar primeiro na tabela de alunos
      let { data: alunoData, error: alunoError } = await supabase
        .from('alunos')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (alunoData && !alunoError) {
        console.log('User data found (aluno):', alunoData);
        setUserData({
          matricula: alunoData.matricula,
          nome: alunoData.nome,
          email: alunoData.email,
          role: 'aluno',
          statusSuspenso: alunoData.status === 'suspenso',
          fimSuspensao: null
        });
        return;
      }

      // Se não encontrar nos alunos, buscar nos professores
      let { data: professorData, error: professorError } = await supabase
        .from('professores')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (professorData && !professorError) {
        console.log('User data found (professor):', professorData);
        setUserData({
          matricula: professorData.matricula,
          nome: professorData.nome,
          email: professorData.email,
          role: 'professor'
        });
        return;
      }

      // Se chegou aqui, usuário existe no Auth mas não na tabela
      console.error('Usuário existe no Auth mas não na tabela - removendo do Auth');
      await supabase.auth.signOut();
      throw new Error('Usuário não cadastrado');
      
    } catch (error) {
      console.error('Erro ao validar usuário na base de dados:', error);
      setUserData(null);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in with:', email);
    
    // Usar Supabase Auth para login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Erro no Auth:', error);
      throw new Error('E-mail ou matrícula incorretos');
    }

    if (!data.user) {
      throw new Error('Falha na autenticação');
    }

    // A validação será feita automaticamente pelo onAuthStateChange
  };

  const signUp = async (email: string, password: string, userInfo: { nome: string; matricula: string; role: 'aluno' | 'professor' }) => {
    console.log('Attempting sign up with:', email, userInfo);
    
    try {
      // 1. Criar usuário no Supabase Auth primeiro
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });

      if (authError) {
        console.error('Erro no Auth SignUp:', authError);
        throw new Error(`Não foi possível criar usuário: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('Não foi possível criar usuário: Falha na criação');
      }

      // 2. Criar registro na tabela correspondente usando o ID do Auth
      const userData = {
        id: authData.user.id,
        matricula: userInfo.matricula,
        nome: userInfo.nome,
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (userInfo.role === 'aluno') {
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
          
          if (alunoError.code === '23505') { // Violação de unicidade
            throw new Error('E-mail ou matrícula já cadastrado.');
          }
          throw new Error('Erro ao finalizar cadastro');
        }
      } else {
        const { error: professorError } = await supabase
          .from('professores')
          .insert(userData);
        
        if (professorError) {
          console.error('Erro ao criar professor:', professorError);
          // Remover do Auth se falhar na tabela
          await supabase.auth.admin.deleteUser(authData.user.id);
          
          if (professorError.code === '23505') { // Violação de unicidade
            throw new Error('E-mail ou matrícula já cadastrado.');
          }
          throw new Error('Erro ao finalizar cadastro');
        }
      }

      console.log('Cadastro realizado com sucesso');
    } catch (error) {
      console.error('Erro no processo de cadastro:', error);
      throw error;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    userData,
    loading,
    signIn,
    signUp,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
