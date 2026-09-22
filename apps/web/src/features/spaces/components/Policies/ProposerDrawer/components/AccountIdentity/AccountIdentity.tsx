import type { ReactElement } from 'react'
import { blo } from 'blo'
import { getInitials, getSafeDisplayInfo, TOOLTIP_DELAY_MS } from '@/components/common/AccountRow'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'

export type AccountIdentityProps = {
  address: string
  name?: string
}

const AccountIdentity = ({ address, name }: AccountIdentityProps): ReactElement => {
  const { displayName, shortAddress } = getSafeDisplayInfo(name ?? '', address)

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar size="xs" className="shrink-0">
        <AvatarImage src={blo(address as `0x${string}`)} alt={displayName} />
        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
      </Avatar>

      {/* `text-left` because the drawer list right-aligns its content column */}
      <span className="flex min-w-0 flex-col text-left">
        {name && (
          <Typography variant="paragraph-mini-medium" className="truncate">
            {name}
          </Typography>
        )}
        <Tooltip delay={TOOLTIP_DELAY_MS} disableHoverablePopup>
          <TooltipTrigger render={<span />} className="flex min-w-0">
            {/* Without a name the address is the account's only label, so it stops reading as muted metadata */}
            <Typography
              variant={name ? 'paragraph-mini' : 'paragraph-mini-medium'}
              color={name ? 'muted' : undefined}
              className="truncate font-mono"
            >
              {shortAddress}
            </Typography>
          </TooltipTrigger>
          <TooltipContent className="pointer-events-none select-none font-mono">{address}</TooltipContent>
        </Tooltip>
      </span>
    </div>
  )
}

export default AccountIdentity

export const AccountIdentitySkeleton = (): ReactElement => (
  <div className="flex items-center gap-2" data-testid="account-identity-skeleton">
    <Skeleton className="size-6 shrink-0 rounded-full bg-border" />

    <span className="flex flex-col gap-1">
      <Skeleton className="h-3 w-20 bg-border" />
      <Skeleton className="h-3 w-24 bg-border" />
    </span>
  </div>
)
