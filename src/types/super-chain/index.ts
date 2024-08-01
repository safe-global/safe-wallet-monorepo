import type { Address } from 'viem'
import type { GetUserBadgesQuery } from './.graphclient'

export type WeeklyGasBalance = {
  maxGasInUSD: bigint
  gasUsedInUSD: bigint
}
export type SuperChainAccount = {
  smartAccount: Address
  superChainID: string
  points: bigint
  level: bigint
  noun: bigint[]
  pointsToNextLevel: bigint | null
  weeklyGasBalance: WeeklyGasBalance
}
export type Badge = GetUserBadgesQuery['accountBadges'][number]
export type ResponseBadge = { tier: string; points: string } & Badge['badge'] & {
    claimableTier: number | null
    claimable: boolean
  }
