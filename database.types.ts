export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      account: {
        Row: {
          address: string
        }
        Insert: {
          address: string
        }
        Update: {
          address?: string
        }
        Relationships: []
      }
      accountbadges: {
        Row: {
          account: string | null
          badgeid: number | null
          favorite: boolean | null
          id: number
          isdeleted: boolean | null
          lastclaim: string | null
          lastclaimblock: number | null
          points: number
        }
        Insert: {
          account?: string | null
          badgeid?: number | null
          favorite?: boolean | null
          id?: number
          isdeleted?: boolean | null
          lastclaim?: string | null
          lastclaimblock?: number | null
          points: number
        }
        Update: {
          account?: string | null
          badgeid?: number | null
          favorite?: boolean | null
          id?: number
          isdeleted?: boolean | null
          lastclaim?: string | null
          lastclaimblock?: number | null
          points?: number
        }
        Relationships: [
          {
            foreignKeyName: 'accountbadges_account_fkey'
            columns: ['account']
            isOneToOne: false
            referencedRelation: 'account'
            referencedColumns: ['address']
          },
          {
            foreignKeyName: 'accountbadges_badgeid_fkey'
            columns: ['badgeid']
            isOneToOne: false
            referencedRelation: 'badges'
            referencedColumns: ['id']
          },
        ]
      }
      badges: {
        Row: {
          dataorigin: string | null
          description: string | null
          id: number
          image: string | null
          isactive: boolean | null
          name: string
          networkorprotocol: string | null
        }
        Insert: {
          dataorigin?: string | null
          description?: string | null
          id?: number
          image?: string | null
          isactive?: boolean | null
          name: string
          networkorprotocol?: string | null
        }
        Update: {
          dataorigin?: string | null
          description?: string | null
          id?: number
          image?: string | null
          isactive?: boolean | null
          name?: string
          networkorprotocol?: string | null
        }
        Relationships: []
      }
      citizens: {
        Row: {
          address: string
          ens: string | null
          id: number
        }
        Insert: {
          address: string
          ens?: string | null
          id?: number
        }
        Update: {
          address?: string
          ens?: string | null
          id?: number
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

type PublicSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] & PublicSchema['Views']) | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] & PublicSchema['Views'])
  ? (PublicSchema['Tables'] & PublicSchema['Views'])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
  ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
  ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends keyof PublicSchema['Enums'] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
  ? PublicSchema['Enums'][PublicEnumNameOrOptions]
  : never
