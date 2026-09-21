import { useContext, type ReactElement } from 'react'
import TxCard from '@/components/tx-flow/common/TxCard'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import type { SpendingLimitPolicyFormValues } from '../types'
import { REVIEW_PLACEHOLDER_TEXT, REVIEW_STEP_TITLE } from '../constants'

/**
 * REVIEWERS: skip this file. It is a stand-in so step 1 has somewhere to hand its values, and every
 * line of it is replaced by WA-3151 (the policy summary block) and WA-3152 (building and signing the
 * transaction). It deliberately does not attempt the designed summary.
 */
const ReviewSpendingLimitPolicy = (): ReactElement => {
  const { data } = useContext<TxFlowContextType<SpendingLimitPolicyFormValues>>(TxFlowContext)

  return (
    // Layout props are set per step, so the nonce has to be hidden here too while there is no transaction.
    <TxFlowStep title={REVIEW_STEP_TITLE} hideNonce>
      <TxCard>
        <div className="flex flex-col gap-4" data-testid="review-spending-limit-policy">
          <Alert variant="info">
            <AlertSeverityIcon variant="info" />
            <AlertDescription>{REVIEW_PLACEHOLDER_TEXT}</AlertDescription>
          </Alert>

          <pre className="text-muted-foreground overflow-x-auto text-xs" data-testid="review-raw-values">
            {JSON.stringify(data ?? {}, null, 2)}
          </pre>
        </div>
      </TxCard>
    </TxFlowStep>
  )
}

export default ReviewSpendingLimitPolicy
