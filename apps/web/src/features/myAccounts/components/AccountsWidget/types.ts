import type { SafeItem } from '@/hooks/safes'

export interface SubAccount {
  chainId: string
  fiatTotal?: string
  href: string
}

export interface Account {
  id: string
  name: string
  address: string
  href: string
  safes: SafeItem[]
  fiatTotal?: string
  owners: string
  highlighted?: boolean
  subAccounts?: SubAccount[]
}
