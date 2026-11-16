import type { ReactElement } from 'react'
import { Check, CloudOff } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@safe-global/views/components/ui/empty'

export const QueueLoadError = ({ onRetry }: { onRetry: () => void }): ReactElement => (
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
      <Button variant="outline" onClick={onRetry}>
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
