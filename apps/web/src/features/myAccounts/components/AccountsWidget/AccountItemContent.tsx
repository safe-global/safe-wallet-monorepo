import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import { AccountItem } from '../AccountItem'
import type { Account } from './types'
import Identicon from '@/components/common/Identicon'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Avatar } from '@/components/ui/avatar'
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'

interface AccountItemContentProps {
  account: Account
  children: ReactNode
}

const AccountItemContent = ({ account, children }: AccountItemContentProps): ReactElement => {
  const chainId = account.safes[0]?.chainId ?? ''
  const displayName = useSafeDisplayName(account.address, chainId, account.name) || shortenAddress(account.address)

  return (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <Avatar>
          <Identicon address={account.address} size={40} />
        </Avatar>
        <div className="flex min-w-0 flex-col gap-0.5 text-left">
          <Typography variant="paragraph-bold">{displayName}</Typography>
          <Typography variant="paragraph-mini" color="muted">
            {shortenAddress(account.address, 4)}
          </Typography>
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-4">
        <div className="flex items-center justify-center">
          <AccountItem.ChainBadge safes={account.safes} />
        </div>
        {children}
      </div>
    </>
  )
}

export { AccountItemContent }
