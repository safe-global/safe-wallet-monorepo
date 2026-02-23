import type { ReactElement, ReactNode } from 'react'
import { UserRound } from 'lucide-react'
import SafeWidget from '@/features/spaces/components/SafeWidget'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AccountItem } from '@/features/myAccounts/components/AccountItem'
import type { Account } from '@/features/spaces/hooks/useSpaceAccountsData'

interface AccountsWidgetProps {
  accounts: Account[]
  loading?: boolean
  remainingCount?: number
  onViewAll?: () => void
  action?: ReactNode
}

const SKELETON_COUNT = 3

const getInitial = (name: string): string => name.charAt(0).toUpperCase()

const AccountsWidget = ({
  accounts,
  loading = false,
  remainingCount,
  onViewAll,
  action,
}: AccountsWidgetProps): ReactElement => {
  return (
    <SafeWidget title="Accounts" action={action}>
      {loading
        ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <SafeWidget.ItemSkeleton key={i} />)
        : accounts.map((account) => (
            <SafeWidget.Item
              key={account.id}
              label={account.name}
              info={account.address}
              href={account.href}
              highlighted={account.highlighted}
              startNode={
                <Avatar>
                  <AvatarFallback className="bg-[#f0fdf4] text-sm font-semibold">
                    {getInitial(account.name)}
                  </AvatarFallback>
                </Avatar>
              }
              featuredNode={<AccountItem.ChainBadge safes={account.safes} />}
              actionNode={
                <>
                  <AccountItem.Balance fiatTotal={account.fiatTotal} isLoading={!account.fiatTotal && loading} />
                  <Badge variant="secondary">
                    <UserRound className="size-3" />
                    {account.owners}
                  </Badge>
                </>
              }
            />
          ))}
      {!loading && remainingCount !== undefined && (
        <SafeWidget.Footer count={remainingCount} text="View all accounts" onClick={onViewAll} />
      )}
    </SafeWidget>
  )
}

export { AccountsWidget }
export type { AccountsWidgetProps }
export type { Account } from '@/features/spaces/hooks/useSpaceAccountsData'
export default AccountsWidget
