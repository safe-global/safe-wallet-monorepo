import { useContext, useMemo } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import TxChecksComponent from '@/components/tx/SignOrExecuteForm/TxChecks'
import { SlotName, useRegisterSlot } from '../SlotProvider'

export default () => {
  const { isRejection } = useContext(TxFlowContext)
  const { safeTx } = useContext(SafeTxContext)
  const isCounterfactualSafe = useIsCounterfactualSafe()

  const shouldRegister = useMemo(
    () => !isCounterfactualSafe && !isRejection && !!safeTx,
    [isCounterfactualSafe, isRejection, safeTx],
  )

  const Component = useMemo(() => {
    return safeTx ? () => <TxChecksComponent transaction={safeTx} /> : () => false
  }, [safeTx])

  useRegisterSlot(SlotName.Feature, 'txChecks', Component, shouldRegister)

  return false
}
