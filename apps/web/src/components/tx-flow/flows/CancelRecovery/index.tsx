import { useMemo, type ReactElement } from 'react'
import { CancelRecoveryFlowReview } from './CancelRecoveryFlowReview'
import { CancelRecoveryOverview } from './CancelRecoveryOverview'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '../../TxFlow'
import { TxFlowStep } from '../../TxFlowStep'
import type ReviewTransaction from '@/components/tx/ReviewTransactionV2'

const TITLE = 'Cancel Account recovery'

type CancelRecoveryFlowProps = {
  recovery: RecoveryQueueItem
}

function CancelRecoveryFlow({ recovery }: CancelRecoveryFlowProps): ReactElement {
  const ReviewTransactionComponent = useMemo<typeof ReviewTransaction>(
    () =>
      function ReviewCancelRecovery(props) {
        return <CancelRecoveryFlowReview recovery={recovery} {...props} />
      },
    [recovery],
  )

  return (
    <TxFlow
      subtitle={TITLE}
      eventCategory={TxFlowType.CANCEL_RECOVERY}
      isBatchable={false}
      ReviewTransactionComponent={ReviewTransactionComponent}
    >
      <TxFlowStep title={TITLE} subtitle="" hideNonce>
        <CancelRecoveryOverview />
      </TxFlowStep>
    </TxFlow>
  )
}

export default CancelRecoveryFlow
