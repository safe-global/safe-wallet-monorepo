import { addressIsNotCurrentSafe, addressIsNotReserved } from '@safe-global/utils/utils/validation'
import { checksumAddress, sameAddress } from '@safe-global/utils/utils/addresses'
import {
  RECIPIENT_DUPLICATE_ERROR,
  RECIPIENT_IS_SAFE_ERROR,
  RECIPIENT_RESERVED_ERROR,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { AllowlistFormRecipient, AllowlistRule, RecipientAllowlistFormValues } from '../types'

const uniqueAddresses = (addresses: readonly string[]): string[] => {
  const seen = new Set<string>()
  return addresses.filter((address) => {
    const key = address.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export const getFormTokenAddresses = (heldTokens: readonly string[], values: RecipientAllowlistFormValues): string[] =>
  uniqueAddresses([...heldTokens, ...values.addedTokens])

export const getAllowedTokenAddresses = (
  heldTokens: readonly string[],
  values: RecipientAllowlistFormValues,
): string[] =>
  getFormTokenAddresses(heldTokens, values).filter(
    (token) => !values.excludedTokens.some((excluded) => sameAddress(excluded, token)),
  )

export const getSelectedRecipients = (values: RecipientAllowlistFormValues): AllowlistFormRecipient[] =>
  values.recipients.filter((recipient) => recipient.selected)

export const isAllowlistComplete = (heldTokens: readonly string[], values: RecipientAllowlistFormValues): boolean =>
  getAllowedTokenAddresses(heldTokens, values).length > 0 && getSelectedRecipients(values).length > 0

export const buildAllowlistRules = (
  heldTokens: readonly string[],
  values: RecipientAllowlistFormValues,
): AllowlistRule[] => {
  const recipients = uniqueAddresses(getSelectedRecipients(values).map(({ address }) => checksumAddress(address)))
  if (recipients.length === 0) return []

  return getAllowedTokenAddresses(heldTokens, values).map((token) => ({
    tokenAddress: checksumAddress(token),
    recipients: [...recipients],
  }))
}

/** Added recipients are selected; one already listed is selected again instead of listed twice. */
export const addAllowlistRecipients = (
  recipients: readonly AllowlistFormRecipient[],
  added: readonly AllowlistFormRecipient[],
): AllowlistFormRecipient[] => {
  const reselected = recipients.map((recipient) => {
    const match = added.find(({ address }) => sameAddress(address, recipient.address))
    return match ? { ...recipient, name: recipient.name ?? match.name, selected: true } : recipient
  })
  const fresh = added
    .filter(({ address }, index) => added.findIndex((other) => sameAddress(other.address, address)) === index)
    .filter(({ address }) => !recipients.some((recipient) => sameAddress(recipient.address, address)))
    .map((recipient) => ({ ...recipient, selected: true }))

  return [...reselected, ...fresh]
}

export const validateAllowlistRecipient = (
  address: string,
  { safeAddress, existing }: { safeAddress: string; existing: readonly AllowlistFormRecipient[] },
): string | undefined =>
  addressIsNotReserved(RECIPIENT_RESERVED_ERROR)(address) ??
  addressIsNotCurrentSafe(safeAddress, RECIPIENT_IS_SAFE_ERROR)(address) ??
  (existing.some((recipient) => recipient.selected && sameAddress(recipient.address, address))
    ? RECIPIENT_DUPLICATE_ERROR
    : undefined)
