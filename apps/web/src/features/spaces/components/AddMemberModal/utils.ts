import { isAddress, isAddressEqual } from 'viem'
import type { MemberRole } from '../../hooks/useSpaceMembers'

export type MemberField = {
  name: string
  // Can be an address book name, wallet address, or email.
  identifier: string
  role: MemberRole
}

export type InviteIdentifierPayload =
  | { email: string; role: MemberRole; name: string }
  | { address: string; role: MemberRole; name: string }

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isEmailIdentifier = (value: string): boolean => EMAIL_REGEX.test(value)

export const normalizeIdentifier = (value: string): string => value.trim()

export const buildInviteUserPayload = (data: MemberField): InviteIdentifierPayload => {
  const identifier = normalizeIdentifier(data.identifier)

  if (isEmailIdentifier(identifier)) {
    return {
      email: identifier.toLowerCase(),
      role: data.role,
      name: data.name,
    }
  }

  return {
    address: identifier,
    role: data.role,
    name: data.name,
  }
}

export const getIdentifierValidationError = ({
  identifier,
  sessionEmail,
  walletAddresses,
}: {
  identifier: string
  sessionEmail?: string
  walletAddresses?: string[]
}): string | undefined => {
  const normalizedIdentifier = normalizeIdentifier(identifier)

  if (!normalizedIdentifier) {
    return undefined
  }

  const isEmail = isEmailIdentifier(normalizedIdentifier)
  const isWalletAddress = isAddress(normalizedIdentifier)

  if (!isEmail && !isWalletAddress) {
    return 'Enter a valid email, wallet address, or ENS.'
  }

  if (isEmail && sessionEmail && normalizedIdentifier.toLowerCase() === sessionEmail.toLowerCase()) {
    return "You can't invite yourself."
  }

  if (
    isWalletAddress &&
    walletAddresses?.some((walletAddress) =>
      isAddressEqual(walletAddress as `0x${string}`, normalizedIdentifier as `0x${string}`),
    )
  ) {
    return "You can't invite yourself."
  }

  return undefined
}
