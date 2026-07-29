import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { MemberDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

/**
 * Derive the profile name (avatar initials source) and the display name (identity line)
 * shown in the top-bar account menu, preferring email, then signer address, then member name.
 */
export const getSidebarProfileInfo = (membership?: MemberDto, signerAddress?: string, email?: string) => {
  const memberName = membership?.name || 'User'
  const profileName = email || memberName
  const displayName = email || (signerAddress ? shortenAddress(signerAddress) : memberName)

  return {
    profileName,
    displayName,
  }
}
