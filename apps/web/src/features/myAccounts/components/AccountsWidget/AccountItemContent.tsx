import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import { AccountItem } from '../AccountItem'
import type { Account } from './types'
import Identicon from '@/components/common/Identicon'
import AddressWithCopy from '@/components/common/AddressWithCopy'
import { Avatar } from '@/components/ui/avatar'

interface AccountItemContentProps {
  account: Account
  children: ReactNode
}

const AccountItemContent = ({ account, children }: AccountItemContentProps): ReactElement => {
  return (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <Avatar data-testid="multichain-account-identicon">
          <Identicon address={account.address} size={40} />
        </Avatar>
        <div className="flex min-w-0 flex-col gap-0.5 text-left">
          <Typography data-testid="multichain-account-name" variant="paragraph-bold">
            {account.name}
          </Typography>
          <AddressWithCopy address={account.address} data-testid="multichain-account-address" />
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-4">
        <div data-testid="multichain-account-chain-logos" className="flex items-center justify-center">
          <AccountItem.ChainBadge safes={account.safes} />
        </div>
        {children}
      </div>
    </>
  )
}

export { AccountItemContent }
