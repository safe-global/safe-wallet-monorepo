import { useIsSignedIn } from '@/hooks/useIsSignedIn'
import useWallet from '@/hooks/wallets/useWallet'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useCurrentMemberProfile } from '../../hooks/useSpaceMembers'
import { getSidebarProfileInfo } from './getSidebarProfileInfo'
import { AccountInfo } from '../SpacesList/AccountInfo'

/**
 * Round account icon (with the sign-out popover) for the top bar, next to the
 * wallet section. Rendered only while the user is signed in to a space account;
 * signed-out users see nothing.
 */
const HeaderAccountInfo = () => {
  const isSignedIn = useIsSignedIn()
  const wallet = useWallet()
  const { membership, signerAddress, email, isLoading } = useCurrentMemberProfile()

  if (!isSignedIn) return null

  const { profileName, displayName, shortDisplayName } = getSidebarProfileInfo(membership, signerAddress, email)
  const showConnectedWallet = Boolean(signerAddress) && !sameAddress(wallet?.address, signerAddress)

  return (
    <div className="flex min-w-0 items-center rounded-lg bg-accent" data-testid="header-account-info">
      <AccountInfo
        profileName={profileName}
        displayName={isLoading ? '' : displayName}
        shortDisplayName={isLoading ? '' : shortDisplayName}
        signerAddress={signerAddress}
        connectedWallet={showConnectedWallet ? wallet?.address : undefined}
      />
    </div>
  )
}

export default HeaderAccountInfo
