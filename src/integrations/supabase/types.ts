export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      administradores: {
        Row: {
          atualizado_em: string
          criado_em: string
          email: string
          id: string
          matricula: string
          nome: string
          telefone: string
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          email: string
          id?: string
          matricula: string
          nome: string
          telefone: string
          user_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          email?: string
          id?: string
          matricula?: string
          nome?: string
          telefone?: string
          user_id?: string
        }
        Relationships: []
      }
      alunos: {
        Row: {
          atualizado_em: string
          criado_em: string
          email: string
          fim_suspensao: string | null
          id: string
          matricula: string
          nome: string
          role: string
          status_suspenso: boolean
          telefone: string
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          email: string
          fim_suspensao?: string | null
          id?: string
          matricula: string
          nome: string
          role?: string
          status_suspenso?: boolean
          telefone: string
          user_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          email?: string
          fim_suspensao?: string | null
          id?: string
          matricula?: string
          nome?: string
          role?: string
          status_suspenso?: boolean
          telefone?: string
          user_id?: string
        }
        Relationships: []
      }
      aulas: {
        Row: {
          ativa: boolean
          atualizado_em: string
          capacidade: number
          criado_em: string
          data_aula: string | null
          dia_semana: number
          horario: string
          id: string
          link_meet: string
          nivel: string
          professor_id: string
          professor_nome: string | null
        }
        Insert: {
          ativa?: boolean
          atualizado_em?: string
          capacidade?: number
          criado_em?: string
          data_aula?: string | null
          dia_semana: number
          horario: string
          id?: string
          link_meet: string
          nivel: string
          professor_id: string
          professor_nome?: string | null
        }
        Update: {
          ativa?: boolean
          atualizado_em?: string
          capacidade?: number
          criado_em?: string
          data_aula?: string | null
          dia_semana?: number
          horario?: string
          id?: string
          link_meet?: string
          nivel?: string
          professor_id?: string
          professor_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aulas_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["user_id"]
          },
        ]
      }
      configuracoes_sistema: {
        Row: {
          atualizado_em: string
          criado_em: string
          dia_liberacao: number
          falta_com_aviso_mais_4h: number
          falta_com_aviso_menos_4h: number
          falta_sem_aviso: number
          horario_liberacao: string
          horas_minima_baixa_cancelamento: number
          id: string
          mensagem_periodo_inscricao: string
          mensagem_regras_suspensao: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          dia_liberacao?: number
          falta_com_aviso_mais_4h?: number
          falta_com_aviso_menos_4h?: number
          falta_sem_aviso?: number
          horario_liberacao?: string
          horas_minima_baixa_cancelamento?: number
          id?: string
          mensagem_periodo_inscricao?: string
          mensagem_regras_suspensao?: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          dia_liberacao?: number
          falta_com_aviso_mais_4h?: number
          falta_com_aviso_menos_4h?: number
          falta_sem_aviso?: number
          horario_liberacao?: string
          horas_minima_baixa_cancelamento?: number
          id?: string
          mensagem_periodo_inscricao?: string
          mensagem_regras_suspensao?: string
        }
        Relationships: []
      }
      inscricoes: {
        Row: {
          aluno_id: string
          atualizado_em: string
          aula_id: string
          cancelamento: string | null
          criado_em: string
          data_inscricao: string
          id: string
          motivo_cancelamento: string | null
          posicao_espera: number | null
          presenca: boolean | null
          status: string
        }
        Insert: {
          aluno_id: string
          atualizado_em?: string
          aula_id: string
          cancelamento?: string | null
          criado_em?: string
          data_inscricao?: string
          id?: string
          motivo_cancelamento?: string | null
          posicao_espera?: number | null
          presenca?: boolean | null
          status?: string
        }
        Update: {
          aluno_id?: string
          atualizado_em?: string
          aula_id?: string
          cancelamento?: string | null
          criado_em?: string
          data_inscricao?: string
          id?: string
          motivo_cancelamento?: string | null
          posicao_espera?: number | null
          presenca?: boolean | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "inscricoes_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "inscricoes_aula_id_fkey"
            columns: ["aula_id"]
            isOneToOne: false
            referencedRelation: "aulas"
            referencedColumns: ["id"]
          },
        ]
      }
      participacoes: {
        Row: {
          aluno_id: string
          aula_id: string
          criado_em: string
          data_aula: string
          id: string
          presente: boolean
        }
        Insert: {
          aluno_id: string
          aula_id: string
          criado_em?: string
          data_aula: string
          id?: string
          presente?: boolean
        }
        Update: {
          aluno_id?: string
          aula_id?: string
          criado_em?: string
          data_aula?: string
          id?: string
          presente?: boolean
        }
        Relationships: []
      }
      professores: {
        Row: {
          atualizado_em: string
          criado_em: string
          email: string
          id: string
          matricula: string
          nome: string
          telefone: string
          user_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          email: string
          id?: string
          matricula: string
          nome: string
          telefone: string
          user_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          email?: string
          id?: string
          matricula?: string
          nome?: string
          telefone?: string
          user_id?: string
        }
        Relationships: []
      }
      suspensoes: {
        Row: {
          aluno_id: string
          ativa: boolean
          criado_em: string
          data_fim: string
          data_inicio: string
          id: string
          motivo: string
          semanas: number
        }
        Insert: {
          aluno_id: string
          ativa?: boolean
          criado_em?: string
          data_fim: string
          data_inicio?: string
          id?: string
          motivo: string
          semanas: number
        }
        Update: {
          aluno_id?: string
          ativa?: boolean
          criado_em?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          motivo?: string
          semanas?: number
        }
        Relationships: [
          {
            foreignKeyName: "suspensoes_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aplicar_suspensao: {
        Args: {
          aluno_uuid: string
          motivo_param: string
          semanas_param: number
        }
        Returns: undefined
      }
      contar_participacoes: {
        Args: { aluno_uuid: string; dias_param: number }
        Returns: number
      }
      promover_lista_espera: {
        Args: { aula_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
