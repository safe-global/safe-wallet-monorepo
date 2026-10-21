import { addressIsNotCurrentSafe, addressIsNotReserved } from '@safe-global/utils/utils/validation'
import { checksumAddress, sameAddress } from '@safe-global/utils/utils/addresses'
import { RECIPIENT_DUPLICATE_ERROR, RECIPIENT_IS_SAFE_ERROR, RECIPIENT_RESERVED_ERROR } from '../constants'
import type { AllowlistRecipient, AllowlistRule, RecipientAllowlistFormValues } from '../types'

export const getFormTokenAddresses = (heldTokens: readonly string[], values: RecipientAllowlistFormValues): string[] =>
  [...heldTokens, ...values.addedTokens].reduce<string[]>(
    (tokens, token) => (tokens.some((existing) => sameAddress(existing, token)) ? tokens : [...tokens, token]),
    [],
  )

export const getAllowedTokenAddresses = (
  heldTokens: readonly string[],
  values: RecipientAllowlistFormValues,
): string[] =>
  getFormTokenAddresses(heldTokens, values).filter(
    (token) => !values.excludedTokens.some((excluded) => sameAddress(excluded, token)),
  )

export const getSelectedRecipients = (values: RecipientAllowlistFormValues): AllowlistRecipient[] =>
  values.recipients.filter((recipient) => recipient.selected)

export const isAllowlistComplete = (heldTokens: readonly string[], values: RecipientAllowlistFormValues): boolean =>
  getAllowedTokenAddresses(heldTokens, values).length > 0 && getSelectedRecipients(values).length > 0

export const buildAllowlistRules = (
  heldTokens: readonly string[],
  values: RecipientAllowlistFormValues,
): AllowlistRule[] => {
  const recipients = getSelectedRecipients(values).map((recipient) => checksumAddress(recipient.address))
  if (recipients.length === 0) return []

  return getAllowedTokenAddresses(heldTokens, values).map((token) => ({
    tokenAddress: checksumAddress(token),
    recipients,
  }))
}

export const validateAllowlistRecipient = (
  address: string,
  { safeAddress, existing }: { safeAddress: string; existing: readonly AllowlistRecipient[] },
): string | undefined =>
  addressIsNotReserved(RECIPIENT_RESERVED_ERROR)(address) ??
  addressIsNotCurrentSafe(safeAddress, RECIPIENT_IS_SAFE_ERROR)(address) ??
  (existing.some((recipient) => sameAddress(recipient.address, address)) ? RECIPIENT_DUPLICATE_ERROR : undefined)
