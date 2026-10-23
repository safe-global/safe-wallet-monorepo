import type { ReactElement } from 'react'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { TxFlow } from '@/components/tx-flow/TxFlow'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import { TxFlowType } from '@/services/analytics'
import CreateRecipientAllowlistPolicy from './CreateStep'
import { CREATE_STEP_TITLE } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/constants'
import FlowSubtitle from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/FlowSubtitle'
import RecipientAllowlistIcon from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/RecipientAllowlistIcon'

/** The SafeScopeProvider sits above TxFlow so every tx-flow provider and hook resolves the Safe picked in step 1. */
const RecipientAllowlistFlow = (): ReactElement => (
  <SafeScopeProvider>
    <TxFlow
      icon={RecipientAllowlistIcon}
      subtitle={<FlowSubtitle />}
      eventCategory={TxFlowType.SETUP_SPACE_RECIPIENT_ALLOWLIST}
    >
      <TxFlowStep title={CREATE_STEP_TITLE} hideNonce>
        <CreateRecipientAllowlistPolicy />
      </TxFlowStep>
    </TxFlow>
  </SafeScopeProvider>
)

export default RecipientAllowlistFlow
