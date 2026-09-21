import type { ReactElement } from 'react'
import { blo } from 'blo'
import { getInitials, getSafeDisplayInfo } from '@/components/common/AccountRow'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Typography } from '@/components/ui/typography'

export type AccountIdentityProps = {
  address: string
  name?: string
}

/** Compact identicon plus name over shortened address — how the drawer rows name an account. */
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
        <Typography variant="paragraph-mini-medium" className="truncate">
          {displayName}
        </Typography>
        <Typography variant="paragraph-mini" color="muted" className="truncate font-mono">
          {shortAddress}
        </Typography>
      </span>
    </div>
  )
}

export default AccountIdentity
