import { useCallback, useState, type ReactElement } from 'react'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { TxFlow } from '@/components/tx-flow/TxFlow'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import { TxFlowType } from '@/services/analytics'
import CreateRecipientAllowlistPolicy from './CreateStep'
import ReviewRecipientAllowlist from './ReviewStep'
import type { CalloutSection } from './CreateStep/RecipientAllowlistForm'
import {
  createDefaultAllowlistValues,
  type RecipientAllowlistFlowData,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/types'
import { CREATE_STEP_TITLE } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/constants'
import { FLOW_SUBTITLE } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
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
          <CreateRecipientAllowlistPolicy dismissedCallouts={dismissedCallouts} onDismissCallout={dismissCallout} />
        </TxFlowStep>
      </TxFlow>
    </SafeScopeProvider>
  )
}

export default RecipientAllowlistFlow
