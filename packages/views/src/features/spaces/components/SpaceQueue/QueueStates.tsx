import type { ReactElement } from 'react'
import { CloudOff } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
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

export const QueueEmpty = (): ReactElement => (
  <PagePlaceholder img={<NoTransactionsIcon />} text="Pending transactions of your Safe accounts will appear here" />
)

export const QueueTruncatedNotice = ({ shown, total }: { shown: number; total: number }): ReactElement => (
  <Typography variant="paragraph-small" color="muted">
    Showing {shown} of {total} pending transactions.
  </Typography>
)
