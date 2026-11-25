import { checksumAddress, sameAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { AllowlistEntry, AllowlistItemChange } from '@safe-global/views/features/spaces/components/Policies/types'
import { getAllowlistPairKeys } from '@/features/policy-guard/public/services/allowlistPairs'
import type { AllowlistRule, RecipientAllowlistFormValues } from '../types'

export type ListChange = AllowlistItemChange

export const toAllowlistRules = (entries: AllowlistEntry[]): AllowlistRule[] =>
  entries.map(({ token, recipients }) => ({
    tokenAddress: token.address,
    recipients: recipients.map(({ account }) => account),
  }))

const uniqueByAddress = (addresses: string[]): string[] =>
  addresses.filter((address, index) => addresses.findIndex((other) => sameAddress(other, address)) === index)

export const toAllowlistEditValues = (entries: AllowlistEntry[]): RecipientAllowlistFormValues => ({
  tokens: entries.map(({ token }) => ({
    address: token.address,
    symbol: token.symbol || shortenAddress(token.address),
    logoUri: token.logoUri ?? undefined,
  })),
  recipients: uniqueByAddress(entries.flatMap(({ recipients }) => recipients.map(({ account }) => account))).map(
    (address) => ({ address: checksumAddress(address) }),
  ),
})

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
