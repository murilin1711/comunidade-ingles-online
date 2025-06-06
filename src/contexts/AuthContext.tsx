
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
  signUp: (email: string, password: string) => Promise<void>;
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
          try {
            // Tentar buscar primeiro na tabela de alunos
            let { data: alunoData, error: alunoError } = await supabase
              .from('alunos')
              .select('*')
              .eq('email', session.user.email)
              .single();
            
            if (alunoData && !alunoError) {
              console.log('User data found (aluno):', alunoData);
              setUserData({
                matricula: alunoData.matricula,
                nome: alunoData.nome,
                email: alunoData.email,
                role: 'aluno',
                statusSuspenso: alunoData.status === 'suspenso',
                fimSuspensao: null // Will be implemented later when we add this field
              });
            } else {
              // Se não encontrar nos alunos, buscar nos professores
              let { data: professorData, error: professorError } = await supabase
                .from('professores')
                .select('*')
                .eq('email', session.user.email)
                .single();
              
              if (professorData && !professorError) {
                console.log('User data found (professor):', professorData);
                setUserData({
                  matricula: professorData.matricula,
                  nome: professorData.nome,
                  email: professorData.email,
                  role: 'professor'
                });
              } else {
                console.error('Dados do usuário não encontrados');
                setUserData(null);
              }
            }
          } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error);
            setUserData(null);
          }
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

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in with:', email);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    console.log('Attempting sign up with:', email);
    const { error } = await supabase.auth.signUp({
      email,
      password
    });
    if (error) throw error;
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
