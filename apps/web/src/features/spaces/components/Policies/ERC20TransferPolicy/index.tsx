import type { ReactElement } from 'react'
import { UserRoundCheck } from 'lucide-react'
import { TxFlowType } from '@/services/analytics'
import { TOKEN_ALLOWLIST_COPY } from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/constants'
import { createTokenAllowlistFormValues } from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/types'
import type { PolicySafe } from '@safe-global/views/features/spaces/components/Policies/types'
import GuardPolicyFlow from '../GuardPolicyFlow'
import CreateTokenAllowlistPolicy from './CreateStep'
import ReviewTokenAllowlistPolicy from './ReviewStep'

const ERC20TransferPolicyFlow = ({ safe }: { safe?: PolicySafe }): ReactElement => (
  <GuardPolicyFlow
    icon={UserRoundCheck}
    title={TOKEN_ALLOWLIST_COPY.title}
    eventCategory={TxFlowType.SETUP_SPACE_TOKEN_ALLOWLIST}
    safe={safe}
    initialData={createTokenAllowlistFormValues(safe ? `${safe.chainId}:${safe.address}` : undefined)}
    ReviewTransactionComponent={ReviewTokenAllowlistPolicy}
  >
    <CreateTokenAllowlistPolicy />
  </GuardPolicyFlow>
)

export default ERC20TransferPolicyFlow
