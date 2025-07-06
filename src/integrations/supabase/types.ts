export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
          role: string
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
          role?: string
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
          role?: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
