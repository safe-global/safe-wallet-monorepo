import { useCallback, useState, type ReactElement } from 'react'
import SpendingLimitIcon from '@views/features/spaces/components/Policies/SpendingLimitFlow/SpendingLimitIcon'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { TxFlow, type SubmitCallbackWithData } from '@/components/tx-flow/TxFlow'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import { MixpanelEventParams, TxFlowType, trackEvent } from '@/services/analytics'
import { POLICY_EVENTS } from '@/services/analytics/events/policies'
import { ExistingSpendingLimitsProvider } from './ExistingSpendingLimitsProvider'
import CreateSpendingLimitPolicy from './CreateStep'
import ReviewSpendingLimitPolicy from './ReviewStep'
import {
  createDefaultFormValues,
  type SpendingLimitPolicyFormValues,
} from '@views/features/spaces/components/Policies/SpendingLimitFlow/types'
import { CREATE_STEP_TITLE } from '@views/features/spaces/components/Policies/SpendingLimitFlow/constants'
import { SpendingLimitFlowView } from '@views/features/spaces/components/Policies/SpendingLimitFlow/SpendingLimitFlowView'

const trackTxSigned: SubmitCallbackWithData<SpendingLimitPolicyFormValues> = ({ isExecuted = false }) => {
  trackEvent(POLICY_EVENTS.SPENDING_LIMIT_TX_SIGNED, { [MixpanelEventParams.IS_EXECUTED]: isExecuted })
}

/**
 * The SafeScopeProvider sits above TxFlow so every tx-flow provider and hook resolves the Safe picked
 * in step 1. It starts empty because step 1 is where that Safe is chosen.
 */
const SpendingLimitFlow = (): ReactElement => {
  // `TxFlow` renders one step at a time, so anything the Create step should still know after a trip to
  // Review and back has to be held here instead.
  const [isCalloutDismissed, setIsCalloutDismissed] = useState(false)
  const dismissCallout = useCallback(() => setIsCalloutDismissed(true), [])

  return (
    <SafeScopeProvider>
      <ExistingSpendingLimitsProvider>
        <TxFlow
          icon={SpendingLimitIcon}
          subtitle={<SpendingLimitFlowView />}
          ReviewTransactionComponent={ReviewSpendingLimitPolicy}
          eventCategory={TxFlowType.SETUP_SPACE_SPENDING_LIMIT}
          initialData={createDefaultFormValues()}
          onSubmit={trackTxSigned}
        >
          <TxFlowStep title={CREATE_STEP_TITLE} hideNonce>
            <CreateSpendingLimitPolicy isCalloutDismissed={isCalloutDismissed} onDismissCallout={dismissCallout} />
          </TxFlowStep>
        </TxFlow>
      </ExistingSpendingLimitsProvider>
    </SafeScopeProvider>
  )
}

export default SpendingLimitFlow
