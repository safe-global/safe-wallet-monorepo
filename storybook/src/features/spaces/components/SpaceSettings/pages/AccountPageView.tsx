import type { ReactNode } from 'react'
import { LogOut, Pencil } from 'lucide-react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import SpaceSettingsSection, {
  SpaceSettingsSectionTitle,
} from '@views/features/spaces/components/SpaceSettings/SpaceSettingsSection'

export type AccountPageViewProps = {
  status: 'loading' | 'signed-out' | 'active'
  memberName?: string
  role?: string
  email?: string
  signerAddress?: string
  onEditName: () => void
  onSignOut: () => void
  editDialog: ReactNode
  authSections: ReactNode
}

export const AccountPageView = ({
  status,
  memberName,
  role,
  email,
  signerAddress,
  onEditName,
  onSignOut,
  editDialog,
  authSections,
}: AccountPageViewProps) => {
  if (status === 'loading') {
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

  if (status === 'signed-out') {
    return (
      <SpaceSettingsSection data-testid="settings-account-page">
        <SpaceSettingsSectionTitle className="mb-2">Signed in</SpaceSettingsSectionTitle>
        <Typography variant="paragraph-small" color="muted">
          You&apos;re not signed in to this Workspace.
        </Typography>
      </SpaceSettingsSection>
    )
  }

  const displayName = memberName || 'User'

  return (
    <>
      <SpaceSettingsSection data-testid="settings-account-page">
        <SpaceSettingsSectionTitle>Signed in</SpaceSettingsSectionTitle>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <InitialsAvatar name={displayName} size="large" rounded />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <Typography variant="paragraph-small-bold" className="block">
                  {displayName}
                </Typography>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onEditName}
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
          <Button variant="outline" size="sm" onClick={onSignOut} data-testid="settings-account-sign-out">
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Button>
        </div>

        {editDialog}
      </SpaceSettingsSection>

      {authSections}
    </>
  )
}
