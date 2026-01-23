import { useContext } from 'react'
import { TxFlowContext } from '@/features/tx-flow/contexts/TxFlowProvider'
import { SlotName, withSlot } from '@/features/tx-flow/contexts/slots'
import { FEATURES } from '@/utils/featureToggled'
import { BalanceChanges } from '@/components/tx/security/BalanceChanges'
import { useIsCounterfactualSafe } from '@/features/counterfactual'

const useShouldRegisterSlot = () => {
  const { isRejection } = useContext(TxFlowContext)
  const isCounterfactualSafe = useIsCounterfactualSafe()

  return !isCounterfactualSafe && !isRejection
}

const BalanceChangesSlot = withSlot({
  Component: BalanceChanges,
  slotName: SlotName.Main,
  id: 'balanceChanges',
  feature: FEATURES.RISK_MITIGATION,
  useSlotCondition: useShouldRegisterSlot,
})

export default BalanceChangesSlot
