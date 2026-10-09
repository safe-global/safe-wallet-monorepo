import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

const MAX_LOCAL_PART = 8

const shortenEmail = (email: string): string => {
  const atIndex = email.lastIndexOf('@')
  if (atIndex <= MAX_LOCAL_PART) return email

  return `${email.slice(0, MAX_LOCAL_PART)}…${email.slice(atIndex)}`
}

/**
 * Derive the profile name (avatar initials source) and the display name (identity line)
 * shown in the top-bar account menu, preferring email, then signer address, then member name.
 */
export const getSidebarProfileInfo = (membership?: MemberDto, signerAddress?: string, email?: string) => {
  const memberName = membership?.name || 'User'
  const profileName = email || memberName
  const displayName = email || (signerAddress ? shortenAddress(signerAddress) : memberName)
  const shortDisplayName = email ? shortenEmail(email) : displayName

  return {
    profileName,
    displayName,
    shortDisplayName,
  }
}
