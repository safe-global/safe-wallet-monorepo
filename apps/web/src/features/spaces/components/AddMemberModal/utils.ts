import { isAddress } from 'viem'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { MemberRole } from '../../hooks/useSpaceMembers'
import type { EmailInviteUserDto, WalletInviteUserDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

export type MemberField = {
  name: string
  // Can be an address book name, wallet address, or email.
  identifier: string
  role: MemberRole
}

export type InviteIdentifierPayload = EmailInviteUserDto | WalletInviteUserDto

export const EMAIL_IDENTIFIER_MAX_LENGTH = 255

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isEmailIdentifier = (value: string): boolean => EMAIL_REGEX.test(value)

export const normalizeIdentifier = (value: string): string => value.trim()

export const buildInviteUserPayload = (data: MemberField): InviteIdentifierPayload => {
  const identifier = normalizeIdentifier(data.identifier)

  if (isEmailIdentifier(identifier)) {
    return {
      type: 'email',
      email: identifier.toLowerCase(),
      role: data.role,
      name: data.name,
    }
  }

  return {
    type: 'wallet',
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

  if (isEmail && normalizedIdentifier.length > EMAIL_IDENTIFIER_MAX_LENGTH) {
    return `Email must be ${EMAIL_IDENTIFIER_MAX_LENGTH} characters or less.`
  }

  if (!isEmail && !isWalletAddress) {
    return 'Enter a valid email, wallet address, or ENS.'
  }

  if (isEmail && sessionEmail && normalizedIdentifier.toLowerCase() === sessionEmail.toLowerCase()) {
    return "You can't invite yourself."
  }

  if (isWalletAddress && walletAddresses?.some((walletAddress) => sameAddress(walletAddress, normalizedIdentifier))) {
    return "You can't invite yourself."
  }

  return undefined
}
