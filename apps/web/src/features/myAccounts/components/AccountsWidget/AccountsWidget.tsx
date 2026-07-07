import type { ReactElement, ReactNode } from 'react'
import { WalletCards } from 'lucide-react'
import { SafeWidget } from '@/features/spaces'
import { AccountWidgetItem } from './AccountWidgetItem'
import { ExpandableAccountItem } from './ExpandableAccountItem'
import type { Account } from './types'

interface AccountsWidgetProps {
  accounts: Account[]
  loading?: boolean
  /** Total number of Safe accounts in the space — shown as a badge next to "View all". */
  totalCount?: number
  onViewAll?: () => void
  onItemClick?: (safeAddress: string) => void
  emptyStateAction?: ReactNode
  error?: string
  onRefresh?: () => void
}

const SKELETON_COUNT = 3

const AccountsWidget = ({
  accounts,
  loading = false,
  totalCount,
  onViewAll,
  onItemClick,
  emptyStateAction,
  error,
  onRefresh,
}: AccountsWidgetProps): ReactElement => {
  const isEmpty = accounts.length === 0 && !loading
  const hasError = !!error && !loading

  if (hasError) {
    return (
      <SafeWidget title="Accounts" testId="space-dashboard-accounts-widget">
        <SafeWidget.ErrorState message={error} onRefresh={onRefresh} />
      </SafeWidget>
    )
  }

  if (isEmpty) {
    return (
      <SafeWidget title="Accounts" testId="space-dashboard-accounts-widget">
        <SafeWidget.EmptyState
          className="max-w-[229px] mx-auto"
          icon={<WalletCards className="size-6 text-green-500" />}
          text="No accounts yet"
          subtitle="Add your Safe accounts to view balances and manage transactions."
          action={emptyStateAction}
        />
      </SafeWidget>
    )
  }

  return (
    <SafeWidget
      title="Accounts"
      action={onViewAll && <SafeWidget.ViewAll count={totalCount} onClick={onViewAll} />}
      testId="space-dashboard-accounts-widget"
    >
      {loading
        ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <SafeWidget.ItemSkeleton key={i} />)
        : accounts.map((account, rowIndex) =>
            account.safes.length > 1 ? (
              <ExpandableAccountItem
                key={account.address}
                account={account}
                rowIndex={rowIndex}
                loading={loading}
                onItemClick={onItemClick}
              />
            ) : (
              <AccountWidgetItem
                key={account.address}
                account={account}
                rowIndex={rowIndex}
                loading={loading}
                onItemClick={onItemClick}
              />
            ),
          )}
    </SafeWidget>
  )
}

export { AccountsWidget }
export type { AccountsWidgetProps }
export default AccountsWidget
