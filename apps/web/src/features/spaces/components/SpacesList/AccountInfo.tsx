import useLogout from '@/hooks/useLogout'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { AccountInfoView } from '@views/features/spaces/components/SpacesList/AccountInfoView'

interface MembershipProps {
  profileName?: string
  displayName?: string
  shortDisplayName?: string
  isMember?: boolean
  signerAddress?: string
  connectedWallet?: string
}

export const AccountInfo = (props: MembershipProps) => {
  const { logout } = useLogout()

  const handleSignOut = () => {
    trackEvent(SPACE_EVENTS.AUTH_LOGGED_OUT, { timestamp: new Date().toISOString() })
    logout()
  }

  return <AccountInfoView {...props} onSignOut={handleSignOut} />
}
