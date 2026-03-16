import type { ReactElement } from 'react'
import { UserRound } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { WidgetItem } from '@/features/spaces/components/SafeWidget'
import { AccountItem } from '../AccountItem'
import type { Account } from './types'
import Identicon from '@/components/common/Identicon'
import { shortenAddress } from '@safe-global/utils/utils/formatters'

interface AccountWidgetItemProps {
  account: Account
  loading?: boolean
}

const AccountWidgetItem = ({ account, loading = false }: AccountWidgetItemProps): ReactElement => {
  return (
    <WidgetItem
      href={account.href}
      label={<Typography variant="paragraph-bold">{account.name}</Typography>}
      info={
        <Typography variant="paragraph-mini" color="muted">
          {shortenAddress(account.address, 4)}
        </Typography>
      }
      startNode={
        <Avatar>
          <Identicon address={account.address} size={40} />
        </Avatar>
      }
      featuredNode={<AccountItem.ChainBadge safes={account.safes} />}
      actionNode={
        <div className="flex flex-col items-end gap-2">
          <AccountItem.Balance
            className="w-full"
            fiatTotal={account.fiatTotal}
            isLoading={!account.fiatTotal && loading}
          />
          {!account.subAccounts && (
            <Badge variant="secondary">
              <UserRound className="size-3" />
              {account.owners}
            </Badge>
          )}
        </div>
      }
    />
  )
}

export { AccountWidgetItem }
