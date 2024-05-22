import type { Tables } from './database.types'
import type { Address } from 'viem'

export type SuperChainAccount = {
  smartAccount: Address
  superChainID: string
  points: bigint
  level: bigint
  noun: bigint[]
}

export type Tiers = {
  '2DImage': string
  '3DImage': string
  minValue: number
  points: number
}

export type AccountBadge = Omit<
  Tables<'accountbadges'>,
  'account' | 'id' | 'isdeleted' | 'isClaimed' | 'lastclaim' | 'lastclaimBlock'
>
type Badge = Tables<'badges'>
export type ResponseBadges = Omit<AccountBadge, 'lastclaimblock' | 'badgeid'> &
  Omit<Badge, 'dataorigin' | 'isactive' | 'tiers'> & {
    claimableTier: number | null
    points: number
    tiers: Tiers[]
  }
