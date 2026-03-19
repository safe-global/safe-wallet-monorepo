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
import { useSafeDisplayName } from '@/hooks/useSafeDisplayName'

interface AccountWidgetItemProps {
  account: Account
  loading?: boolean
  onItemClick?: (safeAddress: string) => void
}

const AccountWidgetItem = ({ account, loading = false, onItemClick }: AccountWidgetItemProps): ReactElement => {
  const chainId = account.safes[0]?.chainId ?? ''
  const displayName = useSafeDisplayName(account.address, chainId, account.name) || shortenAddress(account.address)

  return (
    <WidgetItem
      href={account.href}
      onClick={onItemClick ? () => onItemClick(account.address) : undefined}
      label={<Typography variant="paragraph-bold">{displayName}</Typography>}
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
