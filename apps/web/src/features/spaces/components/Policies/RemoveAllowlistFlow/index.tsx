import type { ReactElement } from 'react'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { TxFlow } from '@/components/tx-flow/TxFlow'
import { TxFlowType } from '@/services/analytics'
import { FLOW_SUBTITLE } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import RecipientAllowlistIcon from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/RecipientAllowlistIcon'
import ReviewRemoveAllowlist from './ReviewRemoveAllowlist'
import type { RemoveAllowlistFlowData } from './types'

export type { RemoveAllowlistFlowData } from './types'

/** Opened from the allowlist panel's Remove. The Safe is fixed, so the flow starts at review. */
const RemoveAllowlistFlow = (data: RemoveAllowlistFlowData): ReactElement => (
  <SafeScopeProvider initial={{ chainId: data.chainId, safeAddress: data.safeAddress }}>
    <TxFlow<RemoveAllowlistFlowData>
      icon={RecipientAllowlistIcon}
      subtitle={FLOW_SUBTITLE}
      ReviewTransactionComponent={ReviewRemoveAllowlist}
      eventCategory={TxFlowType.REMOVE_SPACE_RECIPIENT_ALLOWLIST}
      initialData={data}
    />
  </SafeScopeProvider>
)

export default RemoveAllowlistFlow
