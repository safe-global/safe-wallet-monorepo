import { useCallback, type ReactElement } from 'react'
import RecoveryPlus from '@/public/images/common/recovery-plus.svg'
import { RemoveRecoveryFlowOverview } from './RemoveRecoveryFlowOverview'
import { RemoveRecoveryFlowReview } from './RemoveRecoveryFlowReview'
import type { RecoveryStateItem } from '@/features/recovery/services/recovery-state'
import { TxFlowType } from '@/services/analytics'
import { TxFlow } from '../../TxFlow'
import { TxFlowStep } from '../../TxFlowStep'
import type { ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'

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
      subtitle="Remove Recoverer"
      ReviewTransactionComponent={RemoveRecoveryReviewStep}
    >
      <TxFlowStep title="Remove Account recovery">
        <RemoveRecoveryFlowOverview delayModifier={delayModifier} />
      </TxFlowStep>
    </TxFlow>
  )
}

export default RemoveRecoveryFlow
