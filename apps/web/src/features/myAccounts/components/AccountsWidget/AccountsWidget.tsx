import type { ReactElement, ReactNode } from 'react'
import { Users } from 'lucide-react'
import SafeWidget from '@/features/spaces/components/SafeWidget'
import { AccountWidgetItem } from './AccountWidgetItem'
import { ExpandableAccountItem } from './ExpandableAccountItem'
import type { Account } from './types'

interface AccountsWidgetProps {
  accounts: Account[]
  loading?: boolean
  remainingCount?: number
  onViewAll?: () => void
  onItemClick?: (safeAddress: string) => void
  action?: ReactNode
  error?: string
  onRefresh?: () => void
}

const SKELETON_COUNT = 3

const AccountsWidget = ({
  accounts,
  loading = false,
  remainingCount,
  onViewAll,
  onItemClick,
  action,
  error,
  onRefresh,
}: AccountsWidgetProps): ReactElement => {
  const isEmpty = accounts.length === 0 && !loading
  const hasError = !!error && !loading

  if (hasError) {
    return (
      <SafeWidget title="Accounts" action={action} testId="space-dashboard-accounts-widget">
        <SafeWidget.ErrorState message={error} onRefresh={onRefresh} />
      </SafeWidget>
    )
  }

  if (isEmpty) {
    return (
      <SafeWidget title="Accounts" action={action} testId="space-dashboard-accounts-widget">
        <SafeWidget.EmptyState icon={<Users className="size-6" />} text="No accounts yet" />
      </SafeWidget>
    )
  }

  return (
    <SafeWidget title="Accounts" action={action} testId="space-dashboard-accounts-widget">
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
      {!loading && remainingCount !== undefined && (
        <SafeWidget.Footer text="View all accounts" onClick={onViewAll} showLeadingSlot={false} />
      )}
    </SafeWidget>
  )
}

export { AccountsWidget }
export type { AccountsWidgetProps }
export default AccountsWidget
