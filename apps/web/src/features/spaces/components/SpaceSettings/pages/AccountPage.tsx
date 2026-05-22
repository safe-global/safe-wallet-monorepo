import { LogOut } from 'lucide-react'
import { useCurrentMemberProfile, MemberStatus } from '@/features/spaces'
import useLogout from '@/hooks/useLogout'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import InitialsAvatar from '../../InitialsAvatar'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Skeleton } from '@/components/ui/skeleton'

const AccountPage = () => {
  const { membership, signerAddress, isLoading } = useCurrentMemberProfile()
  const { logout } = useLogout()

  const handleSignOut = () => {
    trackEvent(SPACE_EVENTS.AUTH_LOGGED_OUT, { timestamp: new Date().toISOString() })
    logout()
  }

  if (isLoading && !membership) {
    return (
      <section className="bg-card rounded-2xl p-6 mb-3">
        <Typography variant="paragraph-bold" className="mb-5 block tracking-tight">
          Signed in
        </Typography>
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-md" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </section>
    )
  }

  if (!membership || membership.status !== MemberStatus.ACTIVE) {
    return (
      <section className="bg-card rounded-2xl p-6 mb-3" data-testid="settings-account-page">
        <Typography variant="paragraph-bold" className="mb-2 block tracking-tight">
          Signed in
        </Typography>
        <Typography variant="paragraph-small" color="muted">
          You&apos;re not signed in to this workspace.
        </Typography>
      </section>
    )
  }

  const memberName = membership.name || 'User'
  const displayName = signerAddress ? shortenAddress(signerAddress) : memberName
  const role = membership.role.toLowerCase()

  return (
    <section className="bg-card rounded-2xl p-6 mb-3" data-testid="settings-account-page">
      <Typography variant="paragraph-bold" className="mb-5 block tracking-tight">
        Signed in
      </Typography>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <InitialsAvatar name={memberName} size="large" rounded />
          <div className="flex flex-col min-w-0">
            <Typography variant="paragraph-small-bold" className="block">
              {memberName}
            </Typography>
            <Typography variant="paragraph-mini" color="muted" className="block mt-0.5 font-mono">
              {displayName}
            </Typography>
            <Typography variant="paragraph-mini" color="muted" className="block mt-0.5 capitalize">
              {role}
            </Typography>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOut} data-testid="settings-account-sign-out">
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </Button>
      </div>
    </section>
  )
}

export default AccountPage
