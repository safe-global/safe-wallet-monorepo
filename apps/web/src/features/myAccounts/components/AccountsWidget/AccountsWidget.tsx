import type { ReactElement, ReactNode } from 'react'
import { WalletCards } from 'lucide-react'
import { SafeWidget } from '@/features/spaces'
import type { AllSafeItems } from '@/hooks/safes'
import SafeAccountsTable from '../SafeAccountsTable'

interface AccountsWidgetProps {
  /** Safe accounts to show — already sliced to the widget's display limit by the caller. */
  items: AllSafeItems
  loading?: boolean
  /** Total number of Safe accounts in the space. The overflow (total − displayed) is shown as a `+N` badge next to "View all". */
  totalCount?: number
  onViewAll?: () => void
  onItemClick?: (safeAddress: string) => void
  emptyStateAction?: ReactNode
  error?: string
  onRefresh?: () => void
}

const SKELETON_COUNT = 5

// The widget mirrors the trusted/welcome account tables — the same columns minus the ones that add no
// value in a compact dashboard card (workspaces, pending, per-row actions).
const WIDGET_COLUMNS = ['name', 'threshold', 'networks', 'balance'] as const

const AccountsWidget = ({
  items,
  loading = false,
  totalCount,
  onViewAll,
  onItemClick,
  emptyStateAction,
  error,
  onRefresh,
}: AccountsWidgetProps): ReactElement => {
  const isEmpty = items.length === 0 && !loading
  const hasError = !!error && !loading
  const overflowCount = totalCount !== undefined ? Math.max(0, totalCount - items.length) : undefined

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
      action={onViewAll && <SafeWidget.ViewAll count={overflowCount} onClick={onViewAll} />}
      testId="space-dashboard-accounts-widget"
    >
      {loading && items.length === 0 ? (
        Array.from({ length: SKELETON_COUNT }).map((_, i) => <SafeWidget.ItemSkeleton key={i} />)
      ) : (
        <SafeAccountsTable
          items={items}
          columns={[...WIDGET_COLUMNS]}
          embedded
          onLinkClick={onItemClick ? (line) => onItemClick(line.address) : undefined}
        />
      )}
    </SafeWidget>
  )
}

export { AccountsWidget }
export type { AccountsWidgetProps }
export default AccountsWidget
