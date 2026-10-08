import type { ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'

export type ProcessingStatusViewProps = {
  willDeploySafe: boolean
  renderSpeedUp?: (modalTrigger: 'alertBox' | 'alertButton') => ReactNode
}

export const ProcessingStatusView = ({ willDeploySafe: isCreatingSafe, renderSpeedUp }: ProcessingStatusViewProps) => (
  <div className="mt-6 px-6">
    <Typography data-testid="transaction-status" variant="h4" className="mt-4">
      {!isCreatingSafe ? 'Transaction is now processing' : 'Nested Safe is now being created'}
    </Typography>
    <Typography variant="paragraph-small" className="mb-6 block">
      {!isCreatingSafe ? 'The transaction' : 'Your Nested Safe'} was confirmed and is now being processed.
    </Typography>
    <div>{renderSpeedUp?.('alertBox')}</div>
  </div>
)
