import { useIsSignedIn } from '@/hooks/useIsSignedIn'
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
  const { membership, signerAddress, email } = useCurrentMemberProfile()

  if (!isSignedIn) return null

  const { profileName, displayName } = getSidebarProfileInfo(membership, signerAddress, email)

  return (
    <div className="flex items-center rounded-lg bg-muted" data-testid="header-account-info">
      <AccountInfo profileName={profileName} displayName={displayName} />
    </div>
  )
}

export default HeaderAccountInfo
