import { useState } from 'react'
import { useCurrentMemberProfile, MemberStatus, getMemberDisplayName } from '@/features/spaces'
import { SwitchAuthenticatorSection, WalletTwoFactorSection } from '@/features/oidc-auth'
import useLogout from '@/hooks/useLogout'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import EditMemberDialog from '../../MembersList/EditMemberDialog'
import { AccountPageView } from '@views/features/spaces/components/SpaceSettings/pages/AccountPageView'

const AccountPage = () => {
  const { membership, signerAddress, email, isLoading } = useCurrentMemberProfile()
  const { logout } = useLogout()
  const [isEditOpen, setIsEditOpen] = useState(false)

  const handleSignOut = () => {
    trackEvent(SPACE_EVENTS.AUTH_LOGGED_OUT)
    logout()
  }

  const isActive = !!membership && membership.status === MemberStatus.ACTIVE
  const status = isLoading && !membership ? 'loading' : isActive ? 'active' : 'signed-out'

  return (
    <AccountPageView
      status={status}
      memberName={membership ? getMemberDisplayName(membership) : undefined}
      role={membership?.role.toLowerCase()}
      email={email}
      signerAddress={signerAddress}
      onEditName={() => setIsEditOpen(true)}
      onSignOut={handleSignOut}
      editDialog={
        isEditOpen && membership ? (
          <EditMemberDialog member={membership} handleClose={() => setIsEditOpen(false)} />
        ) : null
      }
      authSections={
        <>
          <SwitchAuthenticatorSection />
          <WalletTwoFactorSection />
        </>
      }
    />
  )
}

export default AccountPage
