import type { ReactElement } from 'react'
import { Settings2 } from 'lucide-react'
import { TxFlowType } from '@/services/analytics'
import { SAFE_MANAGEMENT_COPY } from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/constants'
import { createSafeManagementFormValues } from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/types'
import type { PolicySafe } from '@safe-global/views/features/spaces/components/Policies/types'
import GuardPolicyFlow from '../GuardPolicyFlow'
import { SAFE_MANAGEMENT_FUNCTION_IDS } from './contracts'
import CreateSafeManagementPolicy from './CreateStep'
import ReviewSafeManagementPolicy from './ReviewStep'

const SafeManagementPolicyFlow = ({ safe }: { safe?: PolicySafe }): ReactElement => (
  <GuardPolicyFlow
    icon={Settings2}
    title={SAFE_MANAGEMENT_COPY.title}
    eventCategory={TxFlowType.SETUP_SPACE_SAFE_MANAGEMENT}
    safe={safe}
    initialData={createSafeManagementFormValues(
      SAFE_MANAGEMENT_FUNCTION_IDS,
      safe ? `${safe.chainId}:${safe.address}` : undefined,
    )}
    ReviewTransactionComponent={ReviewSafeManagementPolicy}
  >
    <CreateSafeManagementPolicy />
  </GuardPolicyFlow>
)

export default SafeManagementPolicyFlow
