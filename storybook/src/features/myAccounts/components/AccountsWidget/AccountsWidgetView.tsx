import type { ReactElement, ReactNode } from 'react'
import { WalletCards } from 'lucide-react'
import SafeWidget from '@/features/spaces/components/SafeWidget'

const SKELETON_COUNT = 5

export type AccountsWidgetViewProps = {
  hasError: boolean
  isEmpty: boolean
  showSkeleton: boolean
  error?: string
  onRefresh?: () => void
  emptyStateAction?: ReactNode
  overflowCount?: number
  onViewAll?: () => void
  table: ReactNode
}

export const AccountsWidgetView = ({
  hasError,
  isEmpty,
  showSkeleton,
  error,
  onRefresh,
  emptyStateAction,
  overflowCount,
  onViewAll,
  table,
}: AccountsWidgetViewProps): ReactElement => {
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
      {showSkeleton ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <SafeWidget.ItemSkeleton key={i} />) : table}
    </SafeWidget>
  )
}
