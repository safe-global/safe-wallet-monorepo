import { checksumAddress, sameAddress } from '@safe-global/utils/utils/addresses'
import type { AllowlistEntry, AllowlistItemChange } from '@safe-global/views/features/spaces/components/Policies/types'
import { getAllowlistPairKeys } from '@/features/policy-guard/services'
import type { AllowlistRule, RecipientAllowlistFormValues } from '../types'

export type ListChange = AllowlistItemChange

export const toAllowlistRules = (entries: AllowlistEntry[]): AllowlistRule[] =>
  entries.map(({ token, recipients }) => ({
    tokenAddress: token.address,
    recipients: recipients.map(({ account }) => account),
  }))

const uniqueByAddress = (addresses: string[]): string[] =>
  addresses.filter((address, index) => addresses.findIndex((other) => sameAddress(other, address)) === index)

export const toAllowlistEditValues = (
  entries: AllowlistEntry[],
  heldTokens: readonly string[],
): RecipientAllowlistFormValues => {
  const liveTokens = entries.map(({ token }) => token.address)
  const isLive = (token: string) => liveTokens.some((live) => sameAddress(live, token))

  return {
    // Every live token, held or not, so a later change to the held list never drops one
    addedTokens: liveTokens,
    excludedTokens: heldTokens.filter((token) => !isLive(token)),
    recipients: uniqueByAddress(entries.flatMap(({ recipients }) => recipients.map(({ account }) => account))).map(
      (address) => ({ address: checksumAddress(address), selected: true }),
    ),
  }
}

export const getLiveRecipients = (baseline: AllowlistRule[]): string[] =>
  uniqueByAddress(baseline.flatMap((rule) => rule.recipients))

/** The form holds one recipient set for every token, so the live rules are widened to that shape before comparing. */
export const toFormBaseline = (baseline: AllowlistRule[]): AllowlistRule[] => {
  const recipients = getLiveRecipients(baseline)
  return baseline.map(({ tokenAddress }) => ({ tokenAddress, recipients }))
}

export const hasAllowlistChanges = (baseline: AllowlistRule[], desired: AllowlistRule[]): boolean => {
  const before = getAllowlistPairKeys(toFormBaseline(baseline))
  const after = getAllowlistPairKeys(desired)

  return before.size !== after.size || [...after].some((key) => !before.has(key))
}

export const markAllowlistChanges = <T>(
  current: T[],
  previous: T[],
  keyOf: (item: T) => string,
): (T & { change?: ListChange })[] => {
  const previousKeys = new Set(previous.map(keyOf))
  const currentKeys = new Set(current.map(keyOf))

  return [
    ...current.map((item) =>
      previousKeys.has(keyOf(item)) ? (item as T & { change?: ListChange }) : { ...item, change: 'added' as const },
    ),
    ...previous
      .filter((item) => !currentKeys.has(keyOf(item)))
      .map((item) => ({ ...item, change: 'removed' as const })),
  ]
}
