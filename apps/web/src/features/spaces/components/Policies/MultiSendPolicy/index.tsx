import type { ReactElement } from 'react'
import { Layers } from 'lucide-react'
import { TxFlowType } from '@/services/analytics'
import { MULTISEND_COPY } from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/constants'
import { createMultiSendFormValues } from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/types'
import type { PolicySafe } from '@safe-global/views/features/spaces/components/Policies/types'
import GuardPolicyFlow from '../GuardPolicyFlow'
import CreateMultiSendPolicy from './CreateStep'
import ReviewMultiSendPolicy from './ReviewStep'

const MultiSendPolicyFlow = ({ safe }: { safe?: PolicySafe }): ReactElement => (
  <GuardPolicyFlow
    icon={Layers}
    title={MULTISEND_COPY.title}
    eventCategory={TxFlowType.SETUP_SPACE_MULTISEND_POLICY}
    safe={safe}
    initialData={createMultiSendFormValues(safe ? `${safe.chainId}:${safe.address}` : undefined)}
    ReviewTransactionComponent={ReviewMultiSendPolicy}
  >
    <CreateMultiSendPolicy />
  </GuardPolicyFlow>
)

export default MultiSendPolicyFlow
