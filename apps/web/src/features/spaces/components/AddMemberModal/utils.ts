import { isAddress } from 'viem'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { MemberRole } from '../../hooks/useSpaceMembers'
import type { EmailInviteUserDto, WalletInviteUserDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

export type MemberField = {
  name: string
  // Can be an address book name, wallet address, or email.
  inviteeIdentifier: string
  role: MemberRole
}

export type InvitePayload = EmailInviteUserDto | WalletInviteUserDto

export const EMAIL_MAX_LENGTH = 255

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isEmailAddress = (value: string): boolean => EMAIL_REGEX.test(value)

export const normalizeInviteeIdentifier = (value: string): string => value.trim()

export const buildInviteUserPayload = (data: MemberField): InvitePayload => {
  const inviteeIdentifier = normalizeInviteeIdentifier(data.inviteeIdentifier)

  if (isEmailAddress(inviteeIdentifier)) {
    return {
      type: 'email',
      email: inviteeIdentifier.toLowerCase(),
      role: data.role,
      name: data.name,
    }
  }

  return {
    type: 'wallet',
    address: inviteeIdentifier,
    role: data.role,
    name: data.name,
  }
}

export const getInviteeIdentifierValidationError = ({
  inviteeIdentifier,
  sessionEmail,
  walletAddresses,
}: {
  inviteeIdentifier: string
  sessionEmail?: string
  walletAddresses?: string[]
}): string | undefined => {
  const normalized = normalizeInviteeIdentifier(inviteeIdentifier)

  if (!normalized) {
    return undefined
  }

  const isEmailIdentifier = isEmailAddress(normalized)
  const isWalletIdentifier = isAddress(normalized)

  if (isEmailIdentifier && normalized.length > EMAIL_MAX_LENGTH) {
    return `Email must be ${EMAIL_MAX_LENGTH} characters or less.`
  }

  if (!isEmailIdentifier && !isWalletIdentifier) {
    return 'Enter a valid email, wallet address, or ENS.'
  }

  if (isEmailIdentifier && sessionEmail && normalized.toLowerCase() === sessionEmail.toLowerCase()) {
    return "You can't invite yourself."
  }

  if (isWalletIdentifier && walletAddresses?.some((walletAddress) => sameAddress(walletAddress, normalized))) {
    return "You can't invite yourself."
  }

  return undefined
}
