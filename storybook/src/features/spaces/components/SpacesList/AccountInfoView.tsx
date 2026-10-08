import { User } from 'lucide-react'
import { ICON_STROKE } from '@/components/common/iconStroke'
import { Popover, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ProfilePopoverContent } from '@/features/spaces/components/Sidebar/ProfilePopoverContent'

export type AccountInfoViewProps = {
  profileName?: string
  displayName?: string
  shortDisplayName?: string
  isMember?: boolean
  signerAddress?: string
  connectedWallet?: string
  onSignOut: () => void
}

export const AccountInfoView = ({
  profileName = '',
  displayName = '',
  shortDisplayName,
  isMember,
  signerAddress,
  connectedWallet,
  onSignOut,
}: AccountInfoViewProps) => {
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
            <span className="hidden max-w-[10rem] min-w-0 truncate text-xs font-normal text-muted-foreground sm:block">
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
        shortDisplayName={shortDisplayName}
        isMember={isMember}
        signerAddress={signerAddress}
        connectedWallet={connectedWallet}
        onSignOut={onSignOut}
      />
    </Popover>
  )
}
