import type { ReactElement } from 'react'
import SafeLogoHalo from '@/components/common/SafeLogoHalo'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyMedia } from '@/components/ui/empty'

export const TX_DETAILS_LOAD_ERROR = 'The website failed to load data. Please try again.'

const TransactionDetailsError = ({
  message = TX_DETAILS_LOAD_ERROR,
  onReload,
}: {
  message?: string
  /** Omitted when reloading cannot recover the state, e.g. a tx belonging to another Safe. */
  onReload?: () => void
}): ReactElement => (
  <Empty data-testid="tx-details-error">
    <EmptyMedia>
      <SafeLogoHalo />
    </EmptyMedia>

    <EmptyDescription>{message}</EmptyDescription>

    {onReload && (
      <EmptyContent>
        <Button variant="outline" onClick={onReload}>
          Reload
        </Button>
      </EmptyContent>
    )}
  </Empty>
)

export default TransactionDetailsError
