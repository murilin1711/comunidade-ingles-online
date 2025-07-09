
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { validatePassword, validateEmail, rateLimitTracker, logSecurityEvent } from '@/utils/security';

interface UserData {
  matricula: string;
  nome: string;
  email: string;
  telefone: string;
  role: 'aluno' | 'professor' | 'admin';
  statusSuspenso?: boolean;
  fimSuspensao?: Date | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userInfo: Omit<UserData, 'statusSuspenso' | 'fimSuspensao'>) => Promise<void>;
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
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer the profile fetch to avoid potential deadlocks
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUserData(null);
        }
        
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for:', userId);
      
      // Try to fetch from alunos table first
      let { data: alunoData, error: alunoError } = await supabase
        .from('alunos')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (alunoData) {
        console.log('Found aluno data:', alunoData);
        setUserData({
          matricula: alunoData.matricula,
          nome: alunoData.nome,
          email: alunoData.email,
          telefone: alunoData.telefone,
          role: 'aluno',
          statusSuspenso: alunoData.status_suspenso,
          fimSuspensao: alunoData.fim_suspensao ? new Date(alunoData.fim_suspensao) : null
        });
        return;
      }

      // If not found in alunos, try professores table
      let { data: professorData, error: professorError } = await supabase
        .from('professores')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (professorData) {
        console.log('Found professor data:', professorData);
        setUserData({
          matricula: professorData.matricula,
          nome: professorData.nome,
          email: professorData.email,
          telefone: professorData.telefone,
          role: 'professor'
        });
        return;
      }

      // If not found in professores, try administradores table
      let { data: adminData, error: adminError } = await supabase
        .from('administradores')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (adminData) {
        console.log('Found admin data:', adminData);
        setUserData({
          matricula: adminData.matricula,
          nome: adminData.nome,
          email: adminData.email,
          telefone: adminData.telefone,
          role: 'admin'
        });
        return;
      }

      console.error('User profile not found in any table');
      console.error('Aluno error:', alunoError);
      console.error('Professor error:', professorError);
      console.error('Admin error:', adminError);
      
      // Set a default userData to prevent null access
      setUserData(null);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    // Input validation
    if (!validateEmail(email)) {
      logSecurityEvent('INVALID_EMAIL_ATTEMPT', { email });
      throw new Error('Email inválido');
    }

    // Rate limiting
    const clientId = email; // In production, use IP address + email
    if (rateLimitTracker.isRateLimited(clientId)) {
      logSecurityEvent('RATE_LIMIT_EXCEEDED', { email });
      throw new Error('Muitas tentativas de login. Tente novamente em 15 minutos.');
    }

    console.log('Attempting sign in with:', email);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Sign in error:', error);
      logSecurityEvent('FAILED_LOGIN_ATTEMPT', { email, error: error.message });
      throw error;
    } else {
      // Reset rate limit on successful login
      rateLimitTracker.reset(clientId);
      logSecurityEvent('SUCCESSFUL_LOGIN', { email });
    }
  };

  const signUp = async (email: string, password: string, userInfo: Omit<UserData, 'statusSuspenso' | 'fimSuspensao'>) => {
    console.log('Attempting sign up with:', email, userInfo);
    
    // Input validation
    if (!validateEmail(email)) {
      logSecurityEvent('INVALID_EMAIL_SIGNUP', { email });
      throw new Error('Email inválido');
    }

    // Password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      logSecurityEvent('WEAK_PASSWORD_ATTEMPT', { email, errors: passwordValidation.errors });
      throw new Error(`Senha inválida: ${passwordValidation.errors.join(', ')}`);
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      console.error('Sign up error:', error);
      logSecurityEvent('FAILED_SIGNUP_ATTEMPT', { email, error: error.message });
      throw error;
    } else {
      logSecurityEvent('SUCCESSFUL_SIGNUP', { email, role: userInfo.role });
    }

    if (data.user) {
      console.log('User created, adding to database:', data.user.id);
      
      // Insert user data into appropriate table
      const userData = {
        user_id: data.user.id,
        matricula: userInfo.matricula,
        nome: userInfo.nome,
        email: userInfo.email,
        telefone: userInfo.telefone
      };

      if (userInfo.role === 'aluno') {
        const { error: insertError } = await supabase
          .from('alunos')
          .insert({
            ...userData,
            status_suspenso: false,
            fim_suspensao: null
          });

        if (insertError) {
          console.error('Error inserting aluno:', insertError);
          throw insertError;
        }
      } else if (userInfo.role === 'professor') {
        // Inserir professor na tabela professores
        const { error: insertError } = await supabase
          .from('professores')
          .insert(userData);

        if (insertError) {
          console.error('Error inserting professor:', insertError);
          throw insertError;
        }
      } else if (userInfo.role === 'admin') {
        // Inserir admin na tabela administradores
        const { error: insertError } = await supabase
          .from('administradores')
          .insert(userData);

        if (insertError) {
          console.error('Error inserting admin:', insertError);
          throw insertError;
        }
      }
    }
  };

  const logout = async () => {
    console.log('Logging out');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
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
