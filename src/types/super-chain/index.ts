import type { Address } from 'viem'
import type { GetUserBadgesQuery } from './.graphclient'

export type WeeklyRelayedTransactions = {
  maxRelayedTransactions: bigint
  relayedTransactions: bigint
}
export type SuperChainAccount = {
  smartAccount: Address
  superChainID: string
  points: bigint
  level: bigint
  noun: bigint[]
  pointsToNextLevel: bigint | null
  weeklyRelayedTransactions: WeeklyRelayedTransactions
}
export type Badge = GetUserBadgesQuery['accountBadges'][number]
export type ResponseBadge = { tier: string; points: string } & Badge['badge'] & {
    claimableTier: number | null
    claimable: boolean
  }
export type SuperChainSmartAccountResponse = [Address, string, string, string, string[]]

export type BadgeTierMetadata = {
  badgeId: number
  level: number
  minValue: number
  '2DImage': string
  '3DImage': string
  points: number
}

export type BadgeMetadata = {
  name: string
  description: string
  platform: string
  chain: string
  condition: string
}

export type BadgeTier = {
  points: string
  tier: string
  uri: string
  metadata: BadgeTierMetadata
}

export type BadgeResponse = {
  points: string
  tier: string
  badge: {
    badgeId: string
    uri: string
    metadata: BadgeMetadata
    badgeTiers: BadgeTier[]
  }
}

export type UserResponse = {
  superchainsmartaccount: SuperChainSmartAccountResponse
  badges: BadgeResponse[]
}
