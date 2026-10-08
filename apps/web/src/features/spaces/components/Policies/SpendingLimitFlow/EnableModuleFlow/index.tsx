import { type ReactElement } from 'react'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { TxFlow } from '@/components/tx-flow/TxFlow'
import { TxFlowType } from '@/services/analytics'
import SpendingLimitIcon from '@/features/spaces/components/Policies/SpendingLimitFlow/SpendingLimitIcon'
import { FLOW_SUBTITLE } from '@/features/spaces/components/Policies/SpendingLimitFlow/constants'
import ReviewEnableModule, { type EnableModuleFlowData } from './ReviewEnableModule'

/** Re-enables the module that still holds an unenforced policy's allowances; the allowances themselves are untouched. */
const EnableSpendingLimitModuleFlow = ({ safe, moduleAddress, spenders }: EnableModuleFlowData): ReactElement => (
  <SafeScopeProvider initial={{ chainId: safe.chainId, safeAddress: safe.address }}>
    <TxFlow<EnableModuleFlowData>
      icon={SpendingLimitIcon}
      subtitle={FLOW_SUBTITLE}
      ReviewTransactionComponent={ReviewEnableModule}
      eventCategory={TxFlowType.ENABLE_SPACE_SPENDING_LIMIT_MODULE}
      initialData={{ safe, moduleAddress, spenders }}
    />
  </SafeScopeProvider>
)

export default EnableSpendingLimitModuleFlow
