import { type ReactElement } from 'react'
import { WalletCards } from 'lucide-react'
import { SafeScopeProvider } from '@/components/tx-flow/safe-scope/SafeScopeProvider'
import { buildSafeScopeKey } from '@/components/tx-flow/safe-scope/utils'
import { TxFlow } from '@/components/tx-flow/TxFlow'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import { TxFlowType } from '@/services/analytics'
import type { PolicySafe } from '../../types'
import CreateSpendingLimitPolicy from '../CreateStep'
import { ExistingSpendingLimitsProvider, useExistingSpendingLimits } from '../ExistingSpendingLimitsProvider'
import ReviewSpendingLimitPolicy from '../ReviewStep'
import { toSpendingLimitFormValues } from '../utils/prefill'
import { EDIT_STEP_TITLE, FLOW_SUBTITLE } from '../constants'
import BaselineGate from './BaselineGate'
import { EditModeProvider } from './EditModeContext'

const SpendingLimitIcon = (): ReactElement => <WalletCards aria-hidden />

const noop = () => {}

/**
 * The form describes the Safe's whole policy, so it is seeded from what the chain holds — read here
 * rather than inside `TxFlow`, whose `initialData` is taken once at mount.
 */
const EditFlowBody = ({ safe }: { safe: PolicySafe }): ReactElement => {
  const { limits, error } = useExistingSpendingLimits()

  return (
    <BaselineGate limits={limits} error={error}>
      {(baseline) => (
        <TxFlow
          icon={SpendingLimitIcon}
          subtitle={FLOW_SUBTITLE}
          ReviewTransactionComponent={ReviewSpendingLimitPolicy}
          eventCategory={TxFlowType.EDIT_SPACE_SPENDING_LIMIT}
          initialData={toSpendingLimitFormValues(buildSafeScopeKey(safe.chainId, safe.address), baseline)}
        >
          <TxFlowStep title={EDIT_STEP_TITLE} hideNonce>
            <CreateSpendingLimitPolicy isCalloutDismissed onDismissCallout={noop} />
          </TxFlowStep>
        </TxFlow>
      )}
    </BaselineGate>
  )
}

const EditSpendingLimitFlow = ({ safe }: { safe: PolicySafe }): ReactElement => (
  <SafeScopeProvider initial={{ chainId: safe.chainId, safeAddress: safe.address }}>
    <ExistingSpendingLimitsProvider>
      <EditModeProvider>
        <EditFlowBody safe={safe} />
      </EditModeProvider>
    </ExistingSpendingLimitsProvider>
  </SafeScopeProvider>
)

export default EditSpendingLimitFlow
