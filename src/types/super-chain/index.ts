import type { Tables } from 'database.types'
import type { Address } from 'viem'

export type SuperChainAccount = {
  smartAccount: Address
  superChainID: string
  points: bigint
  level: bigint
  noun: bigint[]
}

type AccountBadge = Omit<
  Tables<'accountbadges'>,
  'account' | 'id' | 'isdeleted' | 'isClaimed' | 'lastclaim' | 'lastclaimBlock'
>
type Badge = Tables<'badges'>
export type ResponseBadges = Omit<AccountBadge, 'lastclaimblock' | 'badgeid'> & Omit<Badge, 'dataorigin' | 'isactive'>
