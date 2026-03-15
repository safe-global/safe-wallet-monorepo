import type { ReactElement } from 'react'
import { useRouter } from 'next/router'
import { UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AccountItem } from '../AccountItem'
import { AccountItemContent } from './AccountItemContent'
import type { Account } from './types'

interface AccountWidgetItemProps {
  account: Account
  loading?: boolean
  onItemClick?: (safeAddress: string) => void
}

const AccountWidgetItem = ({ account, loading = false, onItemClick }: AccountWidgetItemProps): ReactElement => {
  const router = useRouter()

  const handleClick = () => {
    onItemClick?.(account.address)
    router.push(account.href)
  }

  return (
    <div
      data-slot="widget-item"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className="flex items-center justify-between rounded-sm py-4 pl-4 pr-6 cursor-pointer transition-colors hover:bg-muted/50"
    >
      <AccountItemContent account={account}>
        <div className="flex flex-col items-center gap-2 min-w-16">
          <AccountItem.Balance fiatTotal={account.fiatTotal} isLoading={!account.fiatTotal && loading} />
          {!account.subAccounts && (
            <Badge variant="secondary">
              <UserRound className="size-3" />
              {account.owners}
            </Badge>
          )}
        </div>
      </AccountItemContent>
    </div>
  )
}

export { AccountWidgetItem }
export default AccountWidgetItem
