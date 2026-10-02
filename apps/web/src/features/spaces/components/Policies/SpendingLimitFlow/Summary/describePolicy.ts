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
  EDIT_CALLOUT_DESCRIPTION,
  EDIT_CALLOUT_NO_CHANGES,
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

/** True once any row carries a verdict, which only the edit flow's model does. */
export const isEditSummary = (policy: SpendingLimitSummaryModel): boolean =>
  policy.spenders.some((spender) => spender.limits.some((limit) => limit.change !== undefined))

const countChanges = (policy: SpendingLimitSummaryModel) =>
  policy.spenders
    .flatMap((spender) => spender.limits)
    .reduce(
      (counts, limit) => ({
        added: counts.added + (limit.change === 'added' ? 1 : 0),
        changed: counts.changed + (limit.change === 'changed' ? 1 : 0),
        removed: counts.removed + (limit.change === 'removed' ? 1 : 0),
      }),
      { added: 0, changed: 0, removed: 0 },
    )

/** An edit is described by what it does to the policy, not by the policy it leaves behind. */
export const describeEdit = (policy: SpendingLimitSummaryModel): PolicyDescription => {
  const { added, changed, removed } = countChanges(policy)
  const parts = [
    added > 0 ? `${added} added` : undefined,
    changed > 0 ? `${changed} changed` : undefined,
    removed > 0 ? `${removed} removed` : undefined,
  ].filter((part): part is string => part !== undefined)

  const total = added + changed + removed
  const noun = total === 1 ? CALLOUT_NOUN_SINGULAR : CALLOUT_NOUN_PLURAL
  const title = total === 0 ? EDIT_CALLOUT_NO_CHANGES : `${joinNames(parts)} — ${total} ${noun} in all.`

  return { title, description: EDIT_CALLOUT_DESCRIPTION }
}
