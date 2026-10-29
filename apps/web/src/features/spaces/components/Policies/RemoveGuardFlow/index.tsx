import type { ReactElement } from 'react'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { TxFlow } from '@/components/tx-flow/TxFlow'
import { TxFlowType } from '@/services/analytics'
import { FLOW_SUBTITLE } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import RecipientAllowlistIcon from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/RecipientAllowlistIcon'
import ReviewRemoveGuard from './ReviewRemoveGuard'

export type RemoveGuardFlowProps = { chainId: string; safeAddress: string }

/** Opened from the allowlist panel once a removal is applied. The Safe is fixed, so the flow starts at review. */
const RemoveGuardFlow = ({ chainId, safeAddress }: RemoveGuardFlowProps): ReactElement => (
  <SafeScopeProvider initial={{ chainId, safeAddress }}>
    <TxFlow
      icon={RecipientAllowlistIcon}
      subtitle={FLOW_SUBTITLE}
      ReviewTransactionComponent={ReviewRemoveGuard}
      eventCategory={TxFlowType.REMOVE_SPACE_POLICY_GUARD}
    />
  </SafeScopeProvider>
)

export default RemoveGuardFlow
