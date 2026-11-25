import { useCallback, useState, type ReactElement } from 'react'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import CreateRecipientAllowlistPolicy from '../CreateStep'
import ExistingPoliciesStep from '../ExistingPoliciesStep'
import type { CalloutSection } from '../CreateStep/RecipientAllowlistForm'
import { EXISTING_POLICIES_STEP_TITLE } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'

/** The steps before the review, shared by the create and edit flows; `TxFlow` takes them as its children. */
export const useRecipientAllowlistSteps = (createStepTitle: string): ReactElement[] => {
  // TxFlow renders one step at a time, so callout dismissals must outlive a trip to the next step and back.
  const [dismissedCallouts, setDismissedCallouts] = useState<Record<CalloutSection, boolean>>({
    tokens: false,
    recipients: false,
  })
  const dismissCallout = useCallback(
    (section: CalloutSection) => setDismissedCallouts((current) => ({ ...current, [section]: true })),
    [],
  )
  // Set by Create on Next, in the same update as the step change, so Review's Back returns to Create when it is skipped.
  const [affectsSpendingLimits, setAffectsSpendingLimits] = useState(false)

  // TxFlow counts a skipped `false` step in its progress, so the step is left out of the list instead.
  return [
    <TxFlowStep key="create" title={createStepTitle} hideNonce>
      <CreateRecipientAllowlistPolicy
        dismissedCallouts={dismissedCallouts}
        onDismissCallout={dismissCallout}
        onSpendingLimitImpact={setAffectsSpendingLimits}
      />
    </TxFlowStep>,
    ...(affectsSpendingLimits
      ? [
          <TxFlowStep key="existing-policies" title={EXISTING_POLICIES_STEP_TITLE} hideNonce>
            <ExistingPoliciesStep />
          </TxFlowStep>,
        ]
      : []),
  ]
}
