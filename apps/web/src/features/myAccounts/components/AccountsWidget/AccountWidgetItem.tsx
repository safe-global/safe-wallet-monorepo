import type { ReactElement } from 'react'
import { UserRound } from 'lucide-react'
import { Typography } from '@/components/ui/typography'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { WidgetItem } from '@/features/spaces'
import { AccountItem } from '../AccountItem'
import type { Account } from './types'
import Identicon from '@/components/common/Identicon'
import CopyAddressIconButton from '@/components/common/CopyAddressIconButton'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { NotActivatedBadge } from '@/components/common/SpaceSafeBar/AccountsModal/shared'

interface AccountWidgetItemProps {
  account: Account
  rowIndex: number
  loading?: boolean
  onItemClick?: (safeAddress: string) => void
}

const AccountWidgetItem = ({
  account,
  rowIndex,
  loading = false,
  onItemClick,
}: AccountWidgetItemProps): ReactElement => {
  return (
    <WidgetItem
      testId={`space-dashboard-accounts-row-${rowIndex}`}
      href={account.href}
      onClick={onItemClick ? () => onItemClick(account.address) : undefined}
      label={
        <Typography data-testid="single-account-name" variant="paragraph-bold">
          {account.name}
        </Typography>
      }
      info={
        <div className="flex min-w-0 items-center gap-1.5">
          <Typography data-testid="single-account-address" variant="paragraph-mini" color="muted">
            {shortenAddress(account.address, 4)}
          </Typography>
          <CopyAddressIconButton address={account.address} />
        </div>
      }
      startNode={
        <Avatar data-testid="single-account-identicon">
          <Identicon address={account.address} size={40} />
        </Avatar>
      }
      featuredNode={
        <div data-testid="single-account-chain-logos">
          <AccountItem.ChainBadge safes={account.safes} />
        </div>
      }
      actionNode={
        <div className="flex w-20 flex-col items-end gap-2">
          {account.isUndeployed ? (
            <NotActivatedBadge isActivating={!!account.isActivating} />
          ) : (
            <AccountItem.Balance
              className="w-full"
              data-testid="single-account-balance"
              fiatTotal={account.fiatTotal}
              isLoading={!account.fiatTotal && loading}
            />
          )}
          {!account.subAccounts && (
            <Badge variant="secondary" data-testid="single-account-threshold">
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
