import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { isAddress } from 'ethers'
import { isTotpValid } from '@/features/proposers/utils/totp'
import type { DelegationOrigin, PendingDelegation } from '@/features/proposers/types'

export type DelegationWithTimestamp = PendingDelegation & { _timestamp: number }

/**
 * Parses the origin JSON string from a message and validates it's a delegation origin.
 */
export function parseDelegationOrigin(originStr: string | null | undefined): DelegationOrigin | null {
  if (!originStr) return null
  try {
    const parsed = JSON.parse(originStr)
    if (
      parsed?.type === 'proposer-delegation' &&
      (parsed.action === 'add' || parsed.action === 'remove' || parsed.action === 'edit') &&
      typeof parsed.delegate === 'string' &&
      isAddress(parsed.delegate) &&
      typeof parsed.nestedSafe === 'string' &&
      isAddress(parsed.nestedSafe) &&
      typeof parsed.label === 'string'
    ) {
      return parsed as DelegationOrigin
    }
  } catch {
    // Invalid JSON - not a delegation origin
  }
  return null
}

/**
 * Derives the delegation status based on confirmations and TOTP validity.
 */
export function deriveDelegationStatus(
  confirmationsSubmitted: number,
  confirmationsRequired: number,
  messageTotp: number,
): 'pending' | 'ready' | 'expired' {
  if (!isTotpValid(messageTotp)) return 'expired'
  if (confirmationsSubmitted >= confirmationsRequired) return 'ready'
  return 'pending'
}

/**
 * Extracts the TOTP value from a typed data message.
 * Returns undefined if the TOTP cannot be extracted or is invalid.
 */
export function extractTotpFromMessage(message: MessageItem['message']): number | undefined {
  const typedDataMessage = typeof message === 'object' ? message : null
  const rawTotp = typedDataMessage?.message?.totp
  if (rawTotp === undefined) return undefined
  const totp = Number(rawTotp)
  return isNaN(totp) ? undefined : totp
}

/**
 * Parses a message item into a delegation object if it's a valid delegation for the given Safe.
 */
export function parseMessageToDelegation(
  message: MessageItem,
  safeAddress: string,
  parentSafeAddress: string,
): DelegationWithTimestamp | null {
  const origin = parseDelegationOrigin(message.origin)
  if (!origin || !sameAddress(origin.nestedSafe, safeAddress)) {
    return null
  }

  const messageTotp = extractTotpFromMessage(message.message)
  if (messageTotp === undefined) return null

  const status = deriveDelegationStatus(message.confirmationsSubmitted, message.confirmationsRequired, messageTotp)
  if (status === 'expired') return null

  return {
    messageHash: message.messageHash,
    action: origin.action,
    delegateAddress: origin.delegate,
    delegateLabel: origin.label,
    nestedSafeAddress: origin.nestedSafe,
    parentSafeAddress,
    totp: messageTotp,
    status,
    confirmationsSubmitted: message.confirmationsSubmitted,
    confirmationsRequired: message.confirmationsRequired,
    confirmations: message.confirmations,
    preparedSignature: message.preparedSignature ?? null,
    creationTimestamp: message.creationTimestamp,
    proposedBy: message.proposedBy,
    _timestamp: message.creationTimestamp,
  }
}
