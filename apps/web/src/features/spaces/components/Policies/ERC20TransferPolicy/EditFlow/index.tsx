import type { ReactElement } from 'react'
import { UserRoundCheck } from 'lucide-react'
import { buildSafeScopeKey } from '@safe-global/views/components/tx-flow/safe-scope/utils'
import { TxFlowType } from '@/services/analytics'
import { EditModeProvider } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/EditFlow/EditModeContext'
import {
  GUARD_POLICY_EDIT_STEP_TITLE,
  TOKEN_ALLOWLIST_COPY,
} from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/constants'
import { toTokenAllowlistFormValues } from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/types'
import type { TokenAllowlistPolicy } from '@safe-global/views/features/spaces/components/Policies/types'
import GuardPolicyFlow from '../../GuardPolicyFlow'
import CreateTokenAllowlistPolicy from '../CreateStep'
import ReviewTokenAllowlistPolicy from '../ReviewStep'

/**
 * Editing an allowlist is the create flow with the Safe and the token already decided: the policy
 * is keyed by that pair, so changing either would configure a different access rather than this one.
 */
const EditTokenAllowlistFlow = ({ policy }: { policy: TokenAllowlistPolicy }): ReactElement => (
  <EditModeProvider>
    <GuardPolicyFlow
      icon={UserRoundCheck}
      title={TOKEN_ALLOWLIST_COPY.title}
      eventCategory={TxFlowType.EDIT_SPACE_TOKEN_ALLOWLIST}
      safe={policy.safe}
      stepTitle={GUARD_POLICY_EDIT_STEP_TITLE}
      initialData={toTokenAllowlistFormValues(
        buildSafeScopeKey(policy.safe.chainId, policy.safe.address),
        policy.data.token.address,
        policy.data.recipients,
      )}
      ReviewTransactionComponent={ReviewTokenAllowlistPolicy}
    >
      <CreateTokenAllowlistPolicy />
    </GuardPolicyFlow>
  </EditModeProvider>
)

export default EditTokenAllowlistFlow
