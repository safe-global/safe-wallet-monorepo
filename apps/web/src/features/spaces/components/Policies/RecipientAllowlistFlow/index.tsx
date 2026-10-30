import type { ReactElement } from 'react'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { TxFlow } from '@/components/tx-flow/TxFlow'
import { TxFlowType } from '@/services/analytics'
import ReviewRecipientAllowlist from './ReviewStep'
import { useRecipientAllowlistSteps } from './hooks/useRecipientAllowlistSteps'
import { createDefaultAllowlistValues, type RecipientAllowlistFlowData } from './types'
import { CREATE_STEP_TITLE } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/constants'
import { FLOW_SUBTITLE } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import RecipientAllowlistIcon from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/RecipientAllowlistIcon'

/** The SafeScopeProvider sits above TxFlow so every tx-flow provider and hook resolves the Safe picked in step 1. */
const RecipientAllowlistFlow = (): ReactElement => {
  const steps = useRecipientAllowlistSteps(CREATE_STEP_TITLE)

  return (
    <SafeScopeProvider>
      <TxFlow<RecipientAllowlistFlowData>
        icon={RecipientAllowlistIcon}
        subtitle={FLOW_SUBTITLE}
        ReviewTransactionComponent={ReviewRecipientAllowlist}
        eventCategory={TxFlowType.SETUP_SPACE_RECIPIENT_ALLOWLIST}
        initialData={{ ...createDefaultAllowlistValues(), rules: [] }}
      >
        {steps}
      </TxFlow>
    </SafeScopeProvider>
  )
}

export default RecipientAllowlistFlow
