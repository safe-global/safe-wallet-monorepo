import type { ReactElement } from 'react'
import { Check, CloudOff, Coins } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@safe-global/views/components/ui/empty'

export const SpaceAssetsEmpty = (): ReactElement => (
  <Empty className="rounded-2xl border border-border bg-card">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <Coins />
      </EmptyMedia>
      <EmptyTitle>
        <h2>No Safe accounts yet</h2>
      </EmptyTitle>
      <EmptyDescription>Add Safe accounts to this workspace to see their assets here.</EmptyDescription>
    </EmptyHeader>
  </Empty>
)

export const SpaceAssetsNoMatches = ({ onClear }: { onClear: () => void }): ReactElement => (
  <Empty className="rounded-2xl border border-border bg-card">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <Check />
      </EmptyMedia>
      <EmptyTitle>
        <h2>No Safe accounts match these filters</h2>
      </EmptyTitle>
      <EmptyDescription>Try another Safe account or network, or clear your filters.</EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button variant="outline" onClick={onClear}>
        Clear filters
      </Button>
    </EmptyContent>
  </Empty>
)

export const SpaceAssetsLoadError = ({ onRetry }: { onRetry: () => void }): ReactElement => (
  <Empty role="alert" className="rounded-2xl border border-border bg-card">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <CloudOff />
      </EmptyMedia>
      <EmptyTitle>
        <h2>Couldn&apos;t load the Safe accounts</h2>
      </EmptyTitle>
      <EmptyDescription>Check your connection and try again.</EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </EmptyContent>
  </Empty>
)
