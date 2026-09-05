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
      conciliacao_itens: {
        Row: {
          caixas_nota: number | null
          caixas_pedido: number | null
          conciliacao_id: string
          created_at: string
          descricao_nota: string | null
          descricao_pedido: string | null
          dif_caixas: number | null
          dif_unidades: number | null
          dun: string | null
          ean: string | null
          embalagem_nota: string | null
          embalagem_pedido: string | null
          id: string
          situacao: string
          unidades_nota: number | null
          unidades_pedido: number | null
          user_id: string
        }
        Insert: {
          caixas_nota?: number | null
          caixas_pedido?: number | null
          conciliacao_id: string
          created_at?: string
          descricao_nota?: string | null
          descricao_pedido?: string | null
          dif_caixas?: number | null
          dif_unidades?: number | null
          dun?: string | null
          ean?: string | null
          embalagem_nota?: string | null
          embalagem_pedido?: string | null
          id?: string
          situacao: string
          unidades_nota?: number | null
          unidades_pedido?: number | null
          user_id: string
        }
        Update: {
          caixas_nota?: number | null
          caixas_pedido?: number | null
          conciliacao_id?: string
          created_at?: string
          descricao_nota?: string | null
          descricao_pedido?: string | null
          dif_caixas?: number | null
          dif_unidades?: number | null
          dun?: string | null
          ean?: string | null
          embalagem_nota?: string | null
          embalagem_pedido?: string | null
          id?: string
          situacao?: string
          unidades_nota?: number | null
          unidades_pedido?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conciliacao_itens_conciliacao_id_fkey"
            columns: ["conciliacao_id"]
            isOneToOne: false
            referencedRelation: "conciliacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      conciliacoes: {
        Row: {
          created_at: string
          id: string
          itens_conformes: number
          itens_divergentes: number
          nf_chave: string | null
          nf_cnpj: string | null
          nf_emissao: string | null
          nf_emitente: string | null
          nf_numero: string | null
          nf_serie: string | null
          nf_valor_total: number | null
          pedido_emissao: string | null
          pedido_fornecedor: string | null
          pedido_numero: string | null
          total_itens: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          itens_conformes?: number
          itens_divergentes?: number
          nf_chave?: string | null
          nf_cnpj?: string | null
          nf_emissao?: string | null
          nf_emitente?: string | null
          nf_numero?: string | null
          nf_serie?: string | null
          nf_valor_total?: number | null
          pedido_emissao?: string | null
          pedido_fornecedor?: string | null
          pedido_numero?: string | null
          total_itens?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          itens_conformes?: number
          itens_divergentes?: number
          nf_chave?: string | null
          nf_cnpj?: string | null
          nf_emissao?: string | null
          nf_emitente?: string | null
          nf_numero?: string | null
          nf_serie?: string | null
          nf_valor_total?: number | null
          pedido_emissao?: string | null
          pedido_fornecedor?: string | null
          pedido_numero?: string | null
          total_itens?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
