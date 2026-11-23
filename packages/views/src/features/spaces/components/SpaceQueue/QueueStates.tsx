import type { ReactElement } from 'react'
import { Check, CloudOff } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Spinner } from '@safe-global/views/components/ui/spinner'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@safe-global/views/components/ui/empty'
import { Typography } from '@safe-global/views/components/ui/typography'
import PagePlaceholder from '@safe-global/views/components/common/PagePlaceholder'
import NoTransactionsIcon from '@safe-global/views/assets/images/transactions/no-transactions.svg'

export const QueueLoadError = ({
  onRetry,
  isRetrying,
}: {
  onRetry: () => void
  isRetrying?: boolean
}): ReactElement => (
  <Empty role="alert" className="rounded-2xl border border-border bg-card">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <CloudOff />
      </EmptyMedia>
      <EmptyTitle>
        <h2>Couldn&apos;t load the queue</h2>
      </EmptyTitle>
      <EmptyDescription>
        Your proposals and signatures are unaffected. Check your connection and try again.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button variant="outline" disabled={isRetrying} onClick={onRetry}>
        {isRetrying && <Spinner className="size-3" aria-hidden />}
        Try again
      </Button>
    </EmptyContent>
  </Empty>
)

type QueueNoMatchesProps = {
  hasFilters: boolean
  isSearching: boolean
  /** Clears the filters and the search */
  onClear: () => void
}

export const QueueNoMatches = ({ hasFilters, isSearching, onClear }: QueueNoMatchesProps): ReactElement => {
  const isSearchOnly = isSearching && !hasFilters
  return (
    <Empty className="rounded-2xl border border-border bg-card">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Check />
        </EmptyMedia>
        <EmptyTitle>
          <h2>{isSearchOnly ? 'No proposals match your search' : 'No proposals match these filters'}</h2>
        </EmptyTitle>
        <EmptyDescription>
          {isSearchOnly ? 'Try other words or clear your search.' : 'Try another Safe or clear your filters.'}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={onClear}>
          {isSearchOnly ? 'Clear search' : 'Clear filters'}
        </Button>
      </EmptyContent>
    </Empty>
  )
}

export const QueueEmpty = (): ReactElement => (
  <PagePlaceholder img={<NoTransactionsIcon />} text="Pending transactions of your Safe accounts will appear here" />
)

export const QueueTruncatedNotice = ({ shown, total }: { shown: number; total: number }): ReactElement => (
  <Typography variant="paragraph-small" color="muted">
    Showing {shown} of {total} pending transactions.
  </Typography>
)
