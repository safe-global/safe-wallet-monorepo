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
  rowIndex: number
  loading?: boolean
  onItemClick?: (safeAddress: string) => void
}

const AccountWidgetItem = ({ account, rowIndex, loading = false, onItemClick }: AccountWidgetItemProps): ReactElement => {
  return (
    <WidgetItem
      testId={`space-dashboard-accounts-row-${rowIndex}`}
      href={account.href}
      onClick={onItemClick ? () => onItemClick(account.address) : undefined}
      label={
        <Typography data-testid="space-dashboard-accounts-row-name" variant="paragraph-bold">
          {account.name}
        </Typography>
      }
      info={
        <Typography data-testid="space-dashboard-accounts-row-address" variant="paragraph-mini" color="muted">
          {shortenAddress(account.address, 4)}
        </Typography>
      }
      startNode={
        <Avatar data-testid="space-dashboard-accounts-row-identicon">
          <Identicon address={account.address} size={40} />
        </Avatar>
      }
      featuredNode={
        <div data-testid="space-dashboard-accounts-row-chain-logos">
          <AccountItem.ChainBadge safes={account.safes} />
        </div>
      }
      actionNode={
        <div className="flex flex-col items-end gap-2">
          <AccountItem.Balance
            className="w-full"
            data-testid="space-dashboard-accounts-row-balance"
            fiatTotal={account.fiatTotal}
            isLoading={!account.fiatTotal && loading}
          />
          {!account.subAccounts && (
            <Badge variant="secondary" data-testid="space-dashboard-accounts-row-threshold">
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
