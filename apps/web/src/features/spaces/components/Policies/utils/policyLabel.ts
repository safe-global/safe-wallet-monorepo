import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import {
  hasRecoveryData,
  hasSpendingLimitData,
  type Policy,
  type PolicyAllowance,
  type PolicyTokenInfo,
} from '../types'

/**
 * Labels are derived from the policy. CGW returns no policy name, so a row cannot fall back to an
 * empty or placeholder label. The table column and the detail panel title use the same functions
 * here, which is what keeps the two consistent.
 */

const SECONDS_PER_DAY = 86_400

const RESET_PERIOD_LABELS: Record<number, string> = {
  0: 'one time',
  300: '5 minutes',
  1_800: '30 minutes',
  3_600: 'hour',
  [SECONDS_PER_DAY]: 'day',
  [SECONDS_PER_DAY * 7]: 'week',
  [SECONDS_PER_DAY * 30]: 'month',
}

/** Returns the noun used after a slash, as in `5,000 USDC / day`. */
export const getResetPeriodLabel = (resetPeriodSeconds: number): string =>
  RESET_PERIOD_LABELS[resetPeriodSeconds] ?? `${resetPeriodSeconds} seconds`

export const POLICY_TYPE_LABELS = {
  'spending-limit': 'Spending limit',
  recovery: 'Account recovery',
  proposer: 'Proposer',
} as const

export const formatTokenAmount = (amount: string, token: PolicyTokenInfo): string =>
  `${formatVisualAmount(amount, token.decimals)} ${token.symbol}`

/** For example `5,000 USDC / month`, or `5,000 USDC one time` if the allowance does not repeat. */
export const formatAllowance = (allowance: PolicyAllowance): string => {
  const amount = formatTokenAmount(allowance.amount, allowance.token)
  const period = getResetPeriodLabel(allowance.resetPeriodSeconds)

  return allowance.resetPeriodSeconds === 0 ? `${amount} one time` : `${amount} / ${period}`
}

const formatDays = (seconds: number): string => {
  const days = Math.round(seconds / SECONDS_PER_DAY)
  return `${days} ${days === 1 ? 'day' : 'days'}`
}

const getAllowances = (policy: Extract<Policy, { type: 'spending-limit' }>): PolicyAllowance[] =>
  policy.data.spenders.flatMap((spender) => spender.allowances)

/**
 * The line shown under the policy type. A spending limit with several spenders and tokens has no
 * single allowance that represents it, so the summary counts them instead.
 */
export const getPolicySummary = (policy: Policy): string => {
  if (hasSpendingLimitData(policy)) {
    const allowances = getAllowances(policy)

    if (allowances.length === 0) return 'No limits set'
    if (allowances.length === 1) return formatAllowance(allowances[0])

    const spenderCount = policy.data.spenders.length
    const spenders = `${spenderCount} ${spenderCount === 1 ? 'spender' : 'spenders'}`
    const tokens = `${allowances.length} ${allowances.length === 1 ? 'limit' : 'limits'}`

    return `${spenders} · ${tokens}`
  }

  if (hasRecoveryData(policy)) {
    return `${formatDays(policy.data.reviewWindowSeconds)} review window`
  }

  return 'Never expires'
}

/** The name shown in the RULE column and as the detail panel title. */
export const getPolicyLabel = (policy: Policy): string => POLICY_TYPE_LABELS[policy.type]
