import { formatTokenAmount } from './policyLabel'
import { formatResetTime } from './policyTime'
import type { PolicyAllowance } from '../types'

export type AllowanceUsage = {
  /** 0–100. */
  percentUsed: number
  remainingLabel: string
  resetLabel: string | null
  isExhausted: boolean
  isUntouched: boolean
}

/**
 * How much of an allowance is spent in the current period.
 *
 * `isExhausted` is reported separately so the panel can mark a spent allowance differently. A
 * spender with nothing left cannot spend at all, and that is worth more than a bar at full width.
 */
export const getAllowanceUsage = (allowance: PolicyAllowance): AllowanceUsage => {
  const amount = BigInt(allowance.amount)
  const spent = BigInt(allowance.spent)

  // An allowance of zero permits nothing, so it is fully used. Dividing by it would throw.
  const percentUsed = amount === BigInt(0) ? 100 : Number((spent * BigInt(10_000)) / amount) / 100

  return {
    percentUsed: Math.min(100, Math.max(0, percentUsed)),
    remainingLabel: `${formatTokenAmount(allowance.remaining, allowance.token)} remaining`,
    resetLabel: allowance.resetsAt === null ? null : formatResetTime(allowance.resetsAt),
    isExhausted: BigInt(allowance.remaining) <= BigInt(0),
    isUntouched: spent === BigInt(0),
  }
}
