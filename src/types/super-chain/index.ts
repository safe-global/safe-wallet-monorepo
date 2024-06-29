import type { Tables } from './database.types'
import type { Address } from 'viem'
import type { GetUserBadgesQuery } from './.graphclient'

export type SuperChainAccount = {
  smartAccount: Address
  superChainID: string
  points: bigint
  level: bigint
  noun: bigint[]
  pointsToNextLevel: bigint | null
}

export type Badge = GetUserBadgesQuery['accountBadges'][number]
export type ResponseBadge = Pick<Badge, 'points' | 'tier'> &
  Badge['badge'] & {
    claimableTier: number | null
    claimable: boolean
  }
