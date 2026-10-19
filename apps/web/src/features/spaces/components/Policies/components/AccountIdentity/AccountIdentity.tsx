import type { ReactElement, ReactNode } from 'react'
import NextLink from 'next/link'
import type { AccountIdentityProps } from '@safe-global/views/features/spaces/components/Policies/components/AccountIdentity/types'
import { blo } from 'blo'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { getInitials, getSafeDisplayInfo, TOOLTIP_DELAY_MS } from '@/components/common/AccountRow'
import CopyAddressButton from '@/components/common/CopyAddressButton'
import { Avatar, AvatarFallback, AvatarImage } from '@safe-global/views/components/ui/avatar'
import { Skeleton } from '@safe-global/views/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'

export type { AccountIdentityProps } from '@safe-global/views/features/spaces/components/Policies/components/AccountIdentity/types'

const AccountIdentity = ({ address, name, showCopyButton, href }: AccountIdentityProps): ReactElement => {
  const { displayName, shortAddress } = getSafeDisplayInfo(name ?? '', address)

  const withLink = (label: ReactNode): ReactNode =>
    href ? (
      <NextLink href={href} className="flex min-w-0 text-inherit hover:underline">
        {label}
      </NextLink>
    ) : (
      label
    )

  const addressLabel = (
    <Typography
      variant={name ? 'paragraph-mini' : 'paragraph-mini-medium'}
      color={name ? 'muted' : undefined}
      className="truncate font-mono"
    >
      {shortAddress}
    </Typography>
  )

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar size="xs" className="shrink-0">
        <AvatarImage src={blo(address as `0x${string}`)} alt={displayName} />
        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
      </Avatar>

      {/* `text-left` because the drawer list right-aligns its content column */}
      <span className="flex min-w-0 flex-col text-left">
        {name &&
          withLink(
            <Typography variant="paragraph-mini-medium" className="truncate">
              {name}
            </Typography>,
          )}
        <span className="flex min-w-0 items-center gap-1">
          <Tooltip delay={TOOLTIP_DELAY_MS} disableHoverablePopup>
            <TooltipTrigger render={<span />} className="flex min-w-0">
              {/* Without a name the address is the account's only label, so it stops reading as muted metadata */}
              {name ? addressLabel : withLink(addressLabel)}
            </TooltipTrigger>
            <TooltipContent className="pointer-events-none select-none font-mono">{address}</TooltipContent>
          </Tooltip>

          {showCopyButton && <CopyAddressButton address={checksumAddress(address)} />}
        </span>
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
