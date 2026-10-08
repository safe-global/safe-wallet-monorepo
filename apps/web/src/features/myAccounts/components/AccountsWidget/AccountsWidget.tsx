import type { ReactElement, ReactNode } from 'react'
import type { AllSafeItems } from '@/hooks/safes'
import SafeAccountsTable from '../SafeAccountsTable'
import { AccountsWidgetView } from '@views/features/myAccounts/components/AccountsWidget/AccountsWidgetView'

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

  return (
    <AccountsWidgetView
      hasError={hasError}
      isEmpty={isEmpty}
      showSkeleton={loading && items.length === 0}
      error={error}
      onRefresh={onRefresh}
      emptyStateAction={emptyStateAction}
      overflowCount={overflowCount}
      onViewAll={onViewAll}
      table={
        <SafeAccountsTable
          items={items}
          columns={[...WIDGET_COLUMNS]}
          embedded
          onLinkClick={onItemClick ? (line) => onItemClick(line.address) : undefined}
        />
      }
    />
  )
}

export { AccountsWidget }
export type { AccountsWidgetProps }
export default AccountsWidget
