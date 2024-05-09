import type { Address } from 'viem'
import type { Tables } from './database.types'

export type SuperChainAccount = {
  smartAccount: Address
  superChainID: string
  points: bigint
  level: bigint
  eoas: Address[]
  noun: bigint[]
}

type AccountBadge = Omit<
  Tables<'accountbadges'>,
  'account' | 'id' | 'isdeleted' | 'isClaimed' | 'lastclaim' | 'lastclaimBlock'
>
type Badge = Tables<'badges'>
export type ResponseBadges = Omit<AccountBadge, 'lastclaimblock' | 'badgeid'> & Omit<Badge, 'dataorigin' | 'isactive'>
