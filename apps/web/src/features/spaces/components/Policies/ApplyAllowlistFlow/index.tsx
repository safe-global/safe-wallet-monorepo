import type { ReactElement } from 'react'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { TxFlow } from '@/components/tx-flow/TxFlow'
import { TxFlowType } from '@/services/analytics'
import { FLOW_SUBTITLE } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import RecipientAllowlistIcon from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/RecipientAllowlistIcon'
import ReviewApplyAllowlist from './ReviewApplyAllowlist'
import type { ApplyAllowlistFlowData } from './types'

export type { ApplyAllowlistFlowData } from './types'

/** Opened from the allowlist panel once the guard's delay is over. The Safe is fixed, so the flow starts at review. */
const ApplyAllowlistFlow = (data: ApplyAllowlistFlowData): ReactElement => (
  <SafeScopeProvider initial={{ chainId: data.chainId, safeAddress: data.safeAddress }}>
    <TxFlow<ApplyAllowlistFlowData>
      icon={RecipientAllowlistIcon}
      subtitle={FLOW_SUBTITLE}
      ReviewTransactionComponent={ReviewApplyAllowlist}
      eventCategory={TxFlowType.SETUP_SPACE_RECIPIENT_ALLOWLIST}
      initialData={data}
    />
  </SafeScopeProvider>
)

export default ApplyAllowlistFlow
