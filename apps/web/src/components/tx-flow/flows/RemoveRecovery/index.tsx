import { useCallback, type ReactElement } from 'react'
import RecoveryPlus from '@/public/images/common/recovery-plus.svg'
import { RemoveRecoveryFlowOverview } from './RemoveRecoveryFlowOverview'
import { RemoveRecoveryFlowReview } from './RemoveRecoveryFlowReview'
import type { RecoveryStateItem } from '@/features/recovery'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '../../TxFlow'
import { TxFlowStep } from '../../TxFlowStep'
import type { ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import { REMOVE_RECOVERY_FLOW_COPY as COPY } from '@views/components/tx-flow/flows/RemoveRecovery/copy'

export type RecoveryFlowProps = {
  delayModifier: RecoveryStateItem
}

function RemoveRecoveryFlow({ delayModifier }: RecoveryFlowProps): ReactElement {
  const RemoveRecoveryReviewStep = useCallback(
    (props: ReviewTransactionProps) => <RemoveRecoveryFlowReview delayModifier={delayModifier} {...props} />,
    [delayModifier],
  )

  return (
    <TxFlow
      eventCategory={TxFlowType.REMOVE_RECOVERY}
      icon={RecoveryPlus}
      subtitle={COPY.subtitle}
      ReviewTransactionComponent={RemoveRecoveryReviewStep}
    >
      <TxFlowStep title={COPY.stepTitle}>
        <RemoveRecoveryFlowOverview delayModifier={delayModifier} />
      </TxFlowStep>
    </TxFlow>
  )
}

export default RemoveRecoveryFlow
