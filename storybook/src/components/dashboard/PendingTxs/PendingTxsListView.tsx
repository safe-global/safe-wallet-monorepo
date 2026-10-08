import type { ReactElement, ReactNode } from 'react'
import type { LinkProps } from 'next/link'
import { Typography } from '@/components/ui/typography'
import { Skeleton } from '@/components/ui/skeleton'
import { ViewAllLink } from '@views/components/dashboard/styled'
import { PanelCounter } from '@/components/dashboard/PanelCounter'
import css from './styles.module.css'

const PendingTxsSkeleton = () => (
  <section className="h-full overflow-hidden rounded-xl bg-[var(--color-background-paper)] px-3 py-5">
    <div className="mb-2 flex flex-row px-3">
      <Typography variant="paragraph-bold">Pending transactions</Typography>
    </div>

    <Skeleton className="h-[66px] w-full rounded-lg" />
  </section>
)

const EmptyState = () => {
  return (
    <div data-testid="no-tx-text" className="rounded-xl bg-[var(--color-background-paper)] p-10 text-center">
      <Typography className="mb-1 mt-6">No transactions to sign</Typography>
    </div>
  )
}

export type PendingTxsListViewProps = {
  isLoading: boolean
  queueSize: string
  totalTxs: number
  queueUrl: LinkProps['href']
  recoveryItems: ReactNode
  queuedItems: ReactNode
}

export function PendingTxsListView({
  isLoading,
  queueSize,
  totalTxs,
  queueUrl,
  recoveryItems,
  queuedItems,
}: PendingTxsListViewProps): ReactElement {
  if (isLoading) return <PendingTxsSkeleton />

  return (
    <section
      data-testid="pending-tx-widget"
      className="h-full w-full overflow-hidden rounded-xl bg-[var(--color-background-paper)] px-6 pb-3 pt-5 lg:px-3"
    >
      <div className="mb-2 flex flex-row justify-between px-3">
        <Typography variant="paragraph-bold" className={css.pendingTxHeader}>
          Pending transactions <PanelCounter count={queueSize} />
        </Typography>
        {totalTxs > 0 && <ViewAllLink url={queueUrl} />}
      </div>

      <div>
        {totalTxs > 0 ? (
          <div className={css.list}>
            {recoveryItems}

            {queuedItems}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  )
}
