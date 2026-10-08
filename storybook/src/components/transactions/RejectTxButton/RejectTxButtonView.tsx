import type { ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import Track from '@/components/common/Track'
import { TX_LIST_EVENTS } from '@/services/analytics/events/txList'

export type RejectTxButtonViewProps = {
  isOk: boolean
  isDisabled: boolean
  onClick: () => void
}

export const RejectTxButtonView = ({ isOk, isDisabled, onClick }: RejectTxButtonViewProps): ReactElement => {
  return (
    <Track {...TX_LIST_EVENTS.REJECT}>
      <Button
        data-testid="reject-btn"
        onClick={onClick}
        variant="destructive"
        disabled={!isOk || isDisabled}
        size="action"
      >
        Reject
      </Button>
    </Track>
  )
}
