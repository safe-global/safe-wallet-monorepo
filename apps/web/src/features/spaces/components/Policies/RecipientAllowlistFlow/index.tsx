import { useCallback, useState, type ReactElement } from 'react'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { TxFlow } from '@/components/tx-flow/TxFlow'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import { TxFlowType } from '@/services/analytics'
import CreateRecipientAllowlistPolicy from './CreateStep'
import ReviewRecipientAllowlist from './ReviewStep'
import ExistingPoliciesStep from './ExistingPoliciesStep'
import type { CalloutSection } from './CreateStep/RecipientAllowlistForm'
import { createDefaultAllowlistValues, type RecipientAllowlistFlowData } from './types'
import { CREATE_STEP_TITLE } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/constants'
import {
  EXISTING_POLICIES_STEP_TITLE,
  FLOW_SUBTITLE,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import RecipientAllowlistIcon from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/RecipientAllowlistIcon'

/** The SafeScopeProvider sits above TxFlow so every tx-flow provider and hook resolves the Safe picked in step 1. */
const RecipientAllowlistFlow = (): ReactElement => {
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
  const [restrictsSpendingLimits, setRestrictsSpendingLimits] = useState(false)

  return (
    <SafeScopeProvider>
      <TxFlow<RecipientAllowlistFlowData>
        icon={RecipientAllowlistIcon}
        subtitle={FLOW_SUBTITLE}
        ReviewTransactionComponent={ReviewRecipientAllowlist}
        eventCategory={TxFlowType.SETUP_SPACE_RECIPIENT_ALLOWLIST}
        initialData={{ ...createDefaultAllowlistValues(), rules: [] }}
      >
        <TxFlowStep title={CREATE_STEP_TITLE} hideNonce>
          <CreateRecipientAllowlistPolicy
            dismissedCallouts={dismissedCallouts}
            onDismissCallout={dismissCallout}
            onSpendingLimitImpact={setRestrictsSpendingLimits}
          />
        </TxFlowStep>
        {restrictsSpendingLimits && (
          <TxFlowStep title={EXISTING_POLICIES_STEP_TITLE} hideNonce>
            <ExistingPoliciesStep />
          </TxFlowStep>
        )}
      </TxFlow>
    </SafeScopeProvider>
  )
}

export default RecipientAllowlistFlow
