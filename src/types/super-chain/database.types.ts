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
          account: string
          badgeid: number | null
          favorite: boolean | null
          id: number
          isdeleted: boolean | null
          lastclaim: string | null
          lastclaimblock: number | null
          lastclaimtier: number | null
        }
        Insert: {
          account: string
          badgeid?: number | null
          favorite?: boolean | null
          id?: number
          isdeleted?: boolean | null
          lastclaim?: string | null
          lastclaimblock?: number | null
          lastclaimtier?: number | null
        }
        Update: {
          account?: string
          badgeid?: number | null
          favorite?: boolean | null
          id?: number
          isdeleted?: boolean | null
          lastclaim?: string | null
          lastclaimblock?: number | null
          lastclaimtier?: number | null
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
          description: string
          id: number
          isactive: boolean | null
          lastclaimtier: number | null
          name: string
          network: string
          networkorprotocol: string
          tierdescription: string
          tiers: Json
        }
        Insert: {
          dataorigin?: string | null
          description: string
          id?: number
          isactive?: boolean | null
          lastclaimtier?: number | null
          name: string
          network: string
          networkorprotocol: string
          tierdescription: string
          tiers: Json
        }
        Update: {
          dataorigin?: string | null
          description?: string
          id?: number
          isactive?: boolean | null
          lastclaimtier?: number | null
          name?: string
          network?: string
          networkorprotocol?: string
          tierdescription?: string
          tiers?: Json
        }
        Relationships: []
      }
      citizens: {
        Row: {
          address: string
          claimed: boolean | null
          ens: string | null
          id: number
        }
        Insert: {
          address: string
          claimed?: boolean | null
          ens?: string | null
          id?: number
        }
        Update: {
          address?: string
          claimed?: boolean | null
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
