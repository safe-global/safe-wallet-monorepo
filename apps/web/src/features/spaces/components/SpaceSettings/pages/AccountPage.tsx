import { LogOut, Pencil } from 'lucide-react'
import { useState } from 'react'
import { useCurrentMemberProfile, MemberStatus, getMemberDisplayName } from '@/features/spaces'
import useLogout from '@/hooks/useLogout'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import EditMemberDialog from '../../MembersList/EditMemberDialog'

const AccountPage = () => {
  const { membership, signerAddress, email, isLoading } = useCurrentMemberProfile()
  const { logout } = useLogout()
  const [isEditOpen, setIsEditOpen] = useState(false)

  const handleSignOut = () => {
    trackEvent(SPACE_EVENTS.AUTH_LOGGED_OUT)
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

  const memberName = getMemberDisplayName(membership) || 'User'
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
            <div className="flex items-center gap-1">
              <Typography variant="paragraph-small-bold" className="block">
                {memberName}
              </Typography>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsEditOpen(true)}
                aria-label="Edit your name"
                data-testid="settings-edit-name"
              >
                <Pencil className="size-3.5 text-muted-foreground" />
              </Button>
            </div>
            {email ? (
              <Typography variant="paragraph-mini" color="muted" className="block mt-0.5">
                {email}
              </Typography>
            ) : signerAddress ? (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Typography
                      variant="paragraph-mini"
                      color="muted"
                      className="block mt-0.5 font-mono w-fit cursor-default"
                    />
                  }
                >
                  {shortenAddress(signerAddress)}
                </TooltipTrigger>
                <TooltipContent side="top" className="font-mono">
                  {signerAddress}
                </TooltipContent>
              </Tooltip>
            ) : null}
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

      {isEditOpen && <EditMemberDialog member={membership} handleClose={() => setIsEditOpen(false)} />}
    </section>
  )
}

export default AccountPage
