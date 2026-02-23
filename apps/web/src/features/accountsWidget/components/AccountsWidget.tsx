import type { ReactElement, ReactNode } from 'react'
import SafeWidget from '@/features/spaces/components/SafeWidget'
import { AccountWidgetItem } from './AccountWidgetItem'
import { ExpandableAccountItem } from './ExpandableAccountItem'
import type { Account } from '../types'

interface AccountsWidgetProps {
  accounts: Account[]
  loading?: boolean
  remainingCount?: number
  onViewAll?: () => void
  action?: ReactNode
}

const SKELETON_COUNT = 3

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
        : accounts.map((account) =>
            account.safes.length > 1 ? (
              <ExpandableAccountItem key={account.id} account={account} loading={loading} />
            ) : (
              <AccountWidgetItem key={account.id} account={account} loading={loading} />
            ),
          )}
      {!loading && remainingCount !== undefined && (
        <SafeWidget.Footer count={remainingCount} text="View all accounts" onClick={onViewAll} />
      )}
    </SafeWidget>
  )
}

export { AccountsWidget }
export type { AccountsWidgetProps }
export default AccountsWidget
