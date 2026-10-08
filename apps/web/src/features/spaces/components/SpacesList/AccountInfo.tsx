import { User } from 'lucide-react'
import { ICON_STROKE } from '@/components/common/iconStroke'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import useLogout from '@/hooks/useLogout'
import { ProfilePopoverContent } from '../Sidebar/ProfilePopoverContent'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

interface MembershipProps {
  profileName?: string
  displayName?: string
  shortDisplayName?: string
  signerAddress?: string
  connectedWallet?: string
}

export const AccountInfo = ({
  profileName = '',
  displayName = '',
  shortDisplayName,
  signerAddress,
  connectedWallet,
}: MembershipProps) => {
  const { logout } = useLogout()

  const handleSignOut = () => {
    trackEvent(SPACE_EVENTS.AUTH_LOGGED_OUT, { timestamp: new Date().toISOString() })
    logout()
  }

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              className="flex h-10 min-w-0 shrink cursor-pointer items-center gap-1.5 rounded-lg px-2 outline-none transition-colors hover:bg-muted-foreground/10 focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={displayName ? `Account menu, signed in as ${displayName}` : 'Account menu'}
            />
          }
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success-muted text-success-strong">
            <User className="size-3.5" strokeWidth={ICON_STROKE} aria-hidden="true" />
          </span>

          {displayName && (
            <span className="hidden max-w-[8rem] min-w-0 truncate text-xs font-normal text-muted-foreground sm:block">
              {shortDisplayName || displayName}
            </span>
          )}
        </TooltipTrigger>

        {displayName && (
          <TooltipContent side="bottom" data-testid="account-chip-tooltip">
            Signed in as {displayName}
          </TooltipContent>
        )}
      </Tooltip>

      <ProfilePopoverContent
        avatarName={profileName}
        displayName={displayName}
        signerAddress={signerAddress}
        connectedWallet={connectedWallet}
        onSignOut={handleSignOut}
      />
    </Popover>
  )
}
