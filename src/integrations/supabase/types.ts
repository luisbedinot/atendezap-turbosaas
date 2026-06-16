export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agendamento: {
        Row: {
          card_id: string | null
          company_id: string
          created_at: string
          fim: string
          google_event_id: string | null
          id: string
          inicio: string
          status: string
          titulo: string
        }
        Insert: {
          card_id?: string | null
          company_id: string
          created_at?: string
          fim: string
          google_event_id?: string | null
          id?: string
          inicio: string
          status?: string
          titulo: string
        }
        Update: {
          card_id?: string | null
          company_id?: string
          created_at?: string
          fim?: string
          google_event_id?: string | null
          id?: string
          inicio?: string
          status?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "agendamento_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "crm_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamento_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_config: {
        Row: {
          agendamento_ativo: boolean
          antecedencia_min: string
          apresentacao: string
          como_vender: string
          company_id: string
          cupom: string
          descricao_negocio: string
          diferenciais: string
          duracao_padrao: string
          estilo_comunicacao: string
          faq: string
          formalidade: number
          formas_pagamento: string
          horarios_disponiveis: string
          nao_pode_fazer: string
          nome_agente: string
          nome_empresa: string
          objecoes: string
          ofertas: string
          palavra_despausar: string
          palavra_pausar: string
          papel_objetivo: string
          pedir_avaliacao: boolean
          pode_fazer: string
          politicas: string
          posvenda_msg: string
          produtos_servicos: string
          publico_alvo: string
          reativar_cliente: boolean
          regiao_horario: string
          responder_em_partes: boolean
          segmento: string
          segundos_buffer: number
          servicos_agendaveis: string
          sobre_empresa: string
          tamanho_resposta: string
          telefone_transferencia: string
          ticket_medio: string
          tom: number
          updated_at: string
          usar_emojis: boolean
          user_id: string
        }
        Insert: {
          agendamento_ativo?: boolean
          antecedencia_min?: string
          apresentacao?: string
          como_vender?: string
          company_id: string
          cupom?: string
          descricao_negocio?: string
          diferenciais?: string
          duracao_padrao?: string
          estilo_comunicacao?: string
          faq?: string
          formalidade?: number
          formas_pagamento?: string
          horarios_disponiveis?: string
          nao_pode_fazer?: string
          nome_agente?: string
          nome_empresa?: string
          objecoes?: string
          ofertas?: string
          palavra_despausar?: string
          palavra_pausar?: string
          papel_objetivo?: string
          pedir_avaliacao?: boolean
          pode_fazer?: string
          politicas?: string
          posvenda_msg?: string
          produtos_servicos?: string
          publico_alvo?: string
          reativar_cliente?: boolean
          regiao_horario?: string
          responder_em_partes?: boolean
          segmento?: string
          segundos_buffer?: number
          servicos_agendaveis?: string
          sobre_empresa?: string
          tamanho_resposta?: string
          telefone_transferencia?: string
          ticket_medio?: string
          tom?: number
          updated_at?: string
          usar_emojis?: boolean
          user_id: string
        }
        Update: {
          agendamento_ativo?: boolean
          antecedencia_min?: string
          apresentacao?: string
          como_vender?: string
          company_id?: string
          cupom?: string
          descricao_negocio?: string
          diferenciais?: string
          duracao_padrao?: string
          estilo_comunicacao?: string
          faq?: string
          formalidade?: number
          formas_pagamento?: string
          horarios_disponiveis?: string
          nao_pode_fazer?: string
          nome_agente?: string
          nome_empresa?: string
          objecoes?: string
          ofertas?: string
          palavra_despausar?: string
          palavra_pausar?: string
          papel_objetivo?: string
          pedir_avaliacao?: boolean
          pode_fazer?: string
          politicas?: string
          posvenda_msg?: string
          produtos_servicos?: string
          publico_alvo?: string
          reativar_cliente?: boolean
          regiao_horario?: string
          responder_em_partes?: boolean
          segmento?: string
          segundos_buffer?: number
          servicos_agendaveis?: string
          sobre_empresa?: string
          tamanho_resposta?: string
          telefone_transferencia?: string
          ticket_medio?: string
          tom?: number
          updated_at?: string
          usar_emojis?: boolean
          user_id?: string
        }
        Relationships: []
      }
      app_config: {
        Row: {
          id: boolean
          super_admin_emails: string[]
          updated_at: string
        }
        Insert: {
          id?: boolean
          super_admin_emails?: string[]
          updated_at?: string
        }
        Update: {
          id?: boolean
          super_admin_emails?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      company: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          logo_url: string | null
          nome: string
          primary_color: string
          slug: string
          status_cobranca: string
          telefone: string | null
          trial_ate: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          primary_color?: string
          slug: string
          status_cobranca?: string
          telefone?: string | null
          trial_ate?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          primary_color?: string
          slug?: string
          status_cobranca?: string
          telefone?: string | null
          trial_ate?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_user: {
        Row: {
          ativo: boolean
          company_id: string
          convite_token: string | null
          created_at: string
          forcar_troca_senha: boolean
          id: string
          role: Database["public"]["Enums"]["tenant_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          company_id: string
          convite_token?: string | null
          created_at?: string
          forcar_troca_senha?: boolean
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          company_id?: string
          convite_token?: string | null
          created_at?: string
          forcar_troca_senha?: boolean
          id?: string
          role?: Database["public"]["Enums"]["tenant_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_user_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_pause: {
        Row: {
          company_id: string
          numero: string
          pausado: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          numero: string
          pausado?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          numero?: string
          pausado?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_cards: {
        Row: {
          company_id: string
          follow_up: string | null
          id: string
          nome: string | null
          numero: string
          observacao: string | null
          origem: string | null
          owner_id: string | null
          proxima_acao: string | null
          stage_id: string | null
          status: string
          tags: string[]
          ultima_em: string
          ultima_mensagem: string | null
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          company_id: string
          follow_up?: string | null
          id?: string
          nome?: string | null
          numero: string
          observacao?: string | null
          origem?: string | null
          owner_id?: string | null
          proxima_acao?: string | null
          stage_id?: string | null
          status?: string
          tags?: string[]
          ultima_em?: string
          ultima_mensagem?: string | null
          updated_at?: string
          user_id: string
          valor?: number
        }
        Update: {
          company_id?: string
          follow_up?: string | null
          id?: string
          nome?: string | null
          numero?: string
          observacao?: string | null
          origem?: string | null
          owner_id?: string | null
          proxima_acao?: string | null
          stage_id?: string | null
          status?: string
          tags?: string[]
          ultima_em?: string
          ultima_mensagem?: string | null
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "crm_cards_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_stage"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_stage: {
        Row: {
          company_id: string
          cor: string
          created_at: string
          id: string
          nome: string
          ordem: number
          tipo: Database["public"]["Enums"]["stage_tipo"]
        }
        Insert: {
          company_id: string
          cor?: string
          created_at?: string
          id?: string
          nome: string
          ordem?: number
          tipo?: Database["public"]["Enums"]["stage_tipo"]
        }
        Update: {
          company_id?: string
          cor?: string
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
          tipo?: Database["public"]["Enums"]["stage_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "crm_stage_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      google_integration: {
        Row: {
          access_token: string | null
          calendar_id: string | null
          company_id: string
          conectado: boolean
          email: string | null
          expiry: string | null
          refresh_token: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          calendar_id?: string | null
          company_id: string
          conectado?: boolean
          email?: string | null
          expiry?: string | null
          refresh_token?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          calendar_id?: string | null
          company_id?: string
          conectado?: boolean
          email?: string | null
          expiry?: string | null
          refresh_token?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_integration_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_evento: {
        Row: {
          card_id: string
          company_id: string
          created_at: string
          descricao: string | null
          id: string
          tipo: string
        }
        Insert: {
          card_id: string
          company_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          tipo: string
        }
        Update: {
          card_id?: string
          company_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_evento_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "crm_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_evento_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_nota: {
        Row: {
          autor_id: string | null
          card_id: string
          company_id: string
          created_at: string
          id: string
          texto: string
        }
        Insert: {
          autor_id?: string | null
          card_id: string
          company_id: string
          created_at?: string
          id?: string
          texto: string
        }
        Update: {
          autor_id?: string | null
          card_id?: string
          company_id?: string
          created_at?: string
          id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_nota_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "crm_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_nota_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens: {
        Row: {
          autor: string
          company_id: string
          contato_nome: string | null
          created_at: string
          direcao: string
          id: string
          numero: string
          texto: string
          user_id: string
        }
        Insert: {
          autor: string
          company_id: string
          contato_nome?: string | null
          created_at?: string
          direcao: string
          id?: string
          numero: string
          texto: string
          user_id: string
        }
        Update: {
          autor?: string
          company_id?: string
          contato_nome?: string | null
          created_at?: string
          direcao?: string
          id?: string
          numero?: string
          texto?: string
          user_id?: string
        }
        Relationships: []
      }
      produto: {
        Row: {
          ativo: boolean
          company_id: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          ordem: number
          preco: number
        }
        Insert: {
          ativo?: boolean
          company_id: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
          preco?: number
        }
        Update: {
          ativo?: boolean
          company_id?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
          preco?: number
        }
        Relationships: [
          {
            foreignKeyName: "produto_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          nome: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          nome?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          nome?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_instances: {
        Row: {
          company_id: string
          instance_name: string
          numero: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          instance_name: string
          numero?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          instance_name?: string
          numero?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_super_admin_if_empty: { Args: never; Returns: undefined }
      current_company_id: { Args: never; Returns: string }
      has_company_access: { Args: { _company_id: string }; Returns: boolean }
      has_company_role: {
        Args: { _company_id: string; _roles: string[] }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin"
      stage_tipo: "normal" | "ganho" | "perda"
      tenant_role: "owner" | "admin" | "atendente"
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
    Enums: {
      app_role: ["super_admin"],
      stage_tipo: ["normal", "ganho", "perda"],
      tenant_role: ["owner", "admin", "atendente"],
    },
  },
} as const
