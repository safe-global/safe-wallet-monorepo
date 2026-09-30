/**
 * Builds the two sentences in the summary's callout from the policy model. Pure string work, which is what keeps the
 * wording rules — when a frequency may be named, singular against plural, how several spenders are joined — readable
 * and testable on their own.
 */
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import {
  CALLOUT_DESCRIPTION_PLURAL,
  CALLOUT_DESCRIPTION_SINGULAR,
  CALLOUT_NOUN_PLURAL,
  CALLOUT_NOUN_SINGULAR,
  CALLOUT_TITLE_PREFIX,
} from './constants'
import { describeFrequency } from './frequency'
import type { SpendingLimitSummaryModel, SpenderSummary } from './types'

type PolicyDescription = {
  title: string
  description: string
}

/** Address-book name, else the shortened address — the same fallback the spender card shows. */
export const spenderDisplayName = ({ name, address }: Pick<SpenderSummary, 'name' | 'address'>): string =>
  name?.trim() || shortenAddress(address)

/** `Alice` · `Alice and Bob` · `Alice, Bob and Carol`. */
export const joinNames = (names: readonly string[]): string => {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/** The callout adjective when every limit shares one canonical period; undefined for a mixed or test-chain set. */
const sharedAdjective = (policy: SpendingLimitSummaryModel): string | undefined => {
  const periods = new Set(policy.spenders.flatMap((spender) => spender.limits.map((limit) => limit.resetTimeMin)))
  if (periods.size !== 1) return undefined
  const [resetTimeMin] = [...periods]
  return describeFrequency(resetTimeMin, policy.safe.chainId).adjective
}

/** One sentence cannot enumerate mixed frequencies, so the adjective survives only when every limit shares one. */
export const describePolicy = (policy: SpendingLimitSummaryModel): PolicyDescription => {
  const names = joinNames(policy.spenders.map(spenderDisplayName))
  const count = policy.spenders.reduce((total, spender) => total + spender.limits.length, 0)
  const adjective = sharedAdjective(policy)
  const qualify = (noun: string): string => (adjective ? `${adjective} ${noun}` : noun)
  const noun = count === 1 ? `a ${qualify(CALLOUT_NOUN_SINGULAR)}` : qualify(CALLOUT_NOUN_PLURAL)
  const subject = names ? `${CALLOUT_TITLE_PREFIX} ${names}` : CALLOUT_TITLE_PREFIX

  return {
    title: `${subject} ${noun}.`,
    description: count === 1 ? CALLOUT_DESCRIPTION_SINGULAR : CALLOUT_DESCRIPTION_PLURAL,
  }
}
