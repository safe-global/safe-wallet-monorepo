import { checksumAddress, sameAddress } from '@safe-global/utils/utils/addresses'
import type { AllowlistEntry } from '@safe-global/views/features/spaces/components/Policies/types'
import { getAllowlistPairKeys } from '@/features/policy-guard/services'
import type { AllowlistRule, RecipientAllowlistFormValues } from '../types'

export type ListChange = 'added' | 'removed'

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
  const isHeld = (token: string) => heldTokens.some((held) => sameAddress(held, token))

  return {
    addedTokens: liveTokens.filter((token) => !isHeld(token)),
    excludedTokens: heldTokens.filter((token) => !isLive(token)),
    recipients: uniqueByAddress(entries.flatMap(({ recipients }) => recipients.map(({ account }) => account))).map(
      (address) => ({ address: checksumAddress(address), selected: true }),
    ),
  }
}

/** The form holds one recipient set for every token, so the baseline is widened to that shape before comparing. */
export const hasAllowlistChanges = (baseline: AllowlistRule[], desired: AllowlistRule[]): boolean => {
  const recipients = uniqueByAddress(baseline.flatMap((rule) => rule.recipients))
  const formShaped = baseline.map(({ tokenAddress }) => ({ tokenAddress, recipients }))
  const before = getAllowlistPairKeys(formShaped)
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
