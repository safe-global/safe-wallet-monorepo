import { useContext } from 'react'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { SlotName } from '@safe-global/views/components/tx-flow/slots/SlotProvider'
import { withSlot } from '../slots/withSlot'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { BalanceChanges } from '@/components/tx/security/BalanceChanges'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'

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
