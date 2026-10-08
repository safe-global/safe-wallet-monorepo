import { useMemo, type ReactElement } from 'react'
import { CancelRecoveryFlowReview } from './CancelRecoveryFlowReview'
import { CancelRecoveryOverview } from './CancelRecoveryOverview'
import type { RecoveryQueueItem } from '@/features/recovery'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '../../TxFlow'
import { TxFlowStep } from '../../TxFlowStep'
import type ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import { CANCEL_RECOVERY_FLOW_COPY as COPY } from '@views/components/tx-flow/flows/CancelRecovery/copy'

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
      subtitle={COPY.title}
      eventCategory={TxFlowType.CANCEL_RECOVERY}
      isBatchable={false}
      ReviewTransactionComponent={ReviewTransactionComponent}
    >
      <TxFlowStep title={COPY.title} subtitle={COPY.stepSubtitle} hideNonce>
        <CancelRecoveryOverview />
      </TxFlowStep>
    </TxFlow>
  )
}

export default CancelRecoveryFlow
