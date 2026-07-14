import { LogOut } from 'lucide-react'
import { useCurrentMemberProfile, MemberStatus } from '@/features/spaces'
import useLogout from '@/hooks/useLogout'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import SpaceSettingsSection, { SpaceSettingsSectionTitle } from '../SpaceSettingsSection'

const AccountPage = () => {
  const { membership, signerAddress, email, isLoading } = useCurrentMemberProfile()
  const { logout } = useLogout()

  const handleSignOut = () => {
    trackEvent(SPACE_EVENTS.AUTH_LOGGED_OUT)
    logout()
  }

  if (isLoading && !membership) {
    return (
      <SpaceSettingsSection>
        <SpaceSettingsSectionTitle>Signed in</SpaceSettingsSectionTitle>
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-md" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </SpaceSettingsSection>
    )
  }

  if (!membership || membership.status !== MemberStatus.ACTIVE) {
    return (
      <SpaceSettingsSection data-testid="settings-account-page">
        <SpaceSettingsSectionTitle className="mb-2">Signed in</SpaceSettingsSectionTitle>
        <Typography variant="paragraph-small" color="muted">
          You&apos;re not signed in to this workspace.
        </Typography>
      </SpaceSettingsSection>
    )
  }

  const memberName = membership.name || 'User'
  const role = membership.role.toLowerCase()

  return (
    <SpaceSettingsSection data-testid="settings-account-page">
      <SpaceSettingsSectionTitle>Signed in</SpaceSettingsSectionTitle>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <InitialsAvatar name={memberName} size="large" rounded />
          <div className="flex flex-col min-w-0">
            <Typography variant="paragraph-small-bold" className="block">
              {memberName}
            </Typography>
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
    </SpaceSettingsSection>
  )
}

export default AccountPage
