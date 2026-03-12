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
}

const AccountWidgetItem = ({ account, loading = false }: AccountWidgetItemProps): ReactElement => {
  const router = useRouter()

  return (
    <div
      data-slot="widget-item"
      role="button"
      tabIndex={0}
      onClick={() => router.push(account.href)}
      onKeyDown={(e) => e.key === 'Enter' && router.push(account.href)}
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
