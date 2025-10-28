import { useContext } from 'react'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { SlotName, withSlot } from '../slots'
import { FEATURES } from '@/utils/featureToggled'
import { BlockaidBalanceChanges } from '@/components/tx/security/blockaid/BlockaidBalanceChange'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'

const useShouldRegisterSlot = () => {
  const { isRejection } = useContext(TxFlowContext)
  const isCounterfactualSafe = useIsCounterfactualSafe()

  return !isCounterfactualSafe && !isRejection
}

const BalanceChangesSlot = withSlot({
  Component: BlockaidBalanceChanges,
  slotName: SlotName.Main,
  id: 'balanceChanges',
  feature: FEATURES.RISK_MITIGATION,
  useSlotCondition: useShouldRegisterSlot,
})

export default BalanceChangesSlot
