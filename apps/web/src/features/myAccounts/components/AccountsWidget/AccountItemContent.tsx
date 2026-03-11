import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import { AccountItem } from '../AccountItem'
import type { Account } from './types'
import Identicon from '@/components/common/Identicon'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Avatar } from '@/components/ui/avatar'

interface AccountItemContentProps {
  account: Account
  children: ReactNode
}

const AccountItemContent = ({ account, children }: AccountItemContentProps): ReactElement => {
  return (
    <>
      <div className="flex w-[220px] items-center gap-4">
        <Avatar>
          <Identicon address={account.address} size={40} />
        </Avatar>
        <div className="flex flex-col gap-0.5 text-left">
          <Typography variant="paragraph-medium">{account.name}</Typography>
          <Typography variant="paragraph-mini" color="muted">
            {shortenAddress(account.address, 4)}
          </Typography>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <AccountItem.ChainBadge safes={account.safes} />
      </div>

      {children}
    </>
  )
}

export { AccountItemContent }
export default AccountItemContent
