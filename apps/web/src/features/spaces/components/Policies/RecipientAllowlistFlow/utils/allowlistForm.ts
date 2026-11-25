import {
  addressIsNotCurrentSafe,
  addressIsNotReserved,
  validatePrefixedAddress,
} from '@safe-global/utils/utils/validation'
import { checksumAddress, parsePrefixedAddress, sameAddress } from '@safe-global/utils/utils/addresses'
import {
  RECIPIENT_DUPLICATE_ERROR,
  RECIPIENT_IS_SAFE_ERROR,
  RECIPIENT_RESERVED_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { AllowlistFormRecipient, AllowlistRule, AllowlistToken, RecipientAllowlistFormValues } from '../types'

type HasAddress = { address: string }

const PASTED_ADDRESS = /^(?:[a-z0-9-]+:)?0x[0-9a-f]{40}$/i

const uniqueAddresses = (addresses: readonly string[]): string[] => {
  const seen = new Set<string>()
  return addresses.filter((address) => {
    const key = address.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const isListed = (items: readonly HasAddress[], address: string): boolean =>
  items.some((item) => sameAddress(item.address, address))

/** The held tokens among the picked ones come first, in the Safe's order, then the others as they were picked. */
export const getAllowedTokenAddresses = (
  heldTokens: readonly string[],
  values: RecipientAllowlistFormValues,
): string[] =>
  uniqueAddresses([
    ...heldTokens.filter((token) => isListed(values.tokens, token)),
    ...values.tokens.map(({ address }) => address),
  ])

export const getUniqueRecipients = (values: RecipientAllowlistFormValues): AllowlistFormRecipient[] =>
  values.recipients.filter(
    ({ address }, index) => values.recipients.findIndex((other) => sameAddress(other.address, address)) === index,
  )

export const isAllowlistComplete = (values: RecipientAllowlistFormValues): boolean =>
  values.tokens.length > 0 && values.recipients.length > 0

export const buildAllowlistRules = (
  heldTokens: readonly string[],
  values: RecipientAllowlistFormValues,
): AllowlistRule[] => {
  const recipients = uniqueAddresses(values.recipients.map(({ address }) => checksumAddress(address)))
  if (recipients.length === 0) return []

  return getAllowedTokenAddresses(heldTokens, values).map((token) => ({
    tokenAddress: checksumAddress(token),
    recipients: [...recipients],
  }))
}

/** Adds the item, or takes it out when one with its address is listed already, whatever the case. */
export const toggleByAddress = <T extends HasAddress>(items: readonly T[], item: T): T[] =>
  isListed(items, item.address) ? items.filter(({ address }) => !sameAddress(address, item.address)) : [...items, item]

/** Picks every listed token that isn't picked yet, or unpicks every listed one, leaving the unlisted ones as they are. */
export const selectAllowlistTokens = (
  tokens: readonly AllowlistToken[],
  listed: readonly AllowlistToken[],
  isSelecting: boolean,
): AllowlistToken[] =>
  isSelecting
    ? [...tokens, ...listed.filter(({ address }) => !isListed(tokens, address))]
    : tokens.filter(({ address }) => !isListed(listed, address))

export const validateAllowlistRecipient = (
  address: string,
  { safeAddress, existing }: { safeAddress: string; existing: readonly AllowlistFormRecipient[] },
): string | undefined =>
  addressIsNotReserved(RECIPIENT_RESERVED_ERROR)(address) ??
  addressIsNotCurrentSafe(safeAddress, RECIPIENT_IS_SAFE_ERROR)(address) ??
  (isListed(existing, address) ? RECIPIENT_DUPLICATE_ERROR : undefined)

/** A query that reads as an address, checksummed, with why it can't be a recipient; `undefined` for a contact search. */
export const parsePastedRecipient = (
  query: string,
  {
    safeAddress,
    chainShortName,
    existing,
  }: { safeAddress: string; chainShortName?: string; existing: readonly AllowlistFormRecipient[] },
): { address: string; error?: string } | undefined => {
  const value = query.trim()
  if (!PASTED_ADDRESS.test(value)) return undefined

  const { address } = parsePrefixedAddress(value)
  return {
    address,
    error:
      validatePrefixedAddress(chainShortName)(value) ?? validateAllowlistRecipient(address, { safeAddress, existing }),
  }
}
