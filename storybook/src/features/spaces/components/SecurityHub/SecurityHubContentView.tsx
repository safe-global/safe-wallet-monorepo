import type { ReactElement, ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'

export type SecurityHubContentViewProps = {
  isLoading: boolean
  isEmpty: boolean
  emptyState: ReactNode
  healthCard: ReactNode
  table: ReactNode
  drawer: ReactNode
}

export const SecurityHubContentView = ({
  isLoading,
  isEmpty,
  emptyState,
  healthCard,
  table,
  drawer,
}: SecurityHubContentViewProps): ReactElement => (
  <>
    {isLoading ? (
      <Typography variant="paragraph-small" color="muted">
        Loading accounts...
      </Typography>
    ) : isEmpty ? (
      emptyState
    ) : (
      <>
        {healthCard}
        {table}
      </>
    )}

    {drawer}
  </>
)
