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

const SELF_INVITE_ERROR = "You can't invite yourself."
const INVALID_IDENTIFIER_ERROR = 'Enter a valid email, wallet address, or ENS.'

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

  if (isEmailAddress(normalized)) {
    if (normalized.length > EMAIL_MAX_LENGTH) {
      return `Email must be ${EMAIL_MAX_LENGTH} characters or less.`
    }
    if (sessionEmail && normalized.toLowerCase() === sessionEmail.toLowerCase()) {
      return SELF_INVITE_ERROR
    }
    return undefined
  }

  if (isAddress(normalized)) {
    if (walletAddresses?.some((walletAddress) => sameAddress(walletAddress, normalized))) {
      return SELF_INVITE_ERROR
    }
    return undefined
  }

  return INVALID_IDENTIFIER_ERROR
}
