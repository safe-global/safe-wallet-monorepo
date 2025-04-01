import type { ReactElement } from 'react'
import { useContext } from 'react'
import madProps from '@/utils/mad-props'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import TxChecksComponent from '@/components/tx/SignOrExecuteForm/TxChecks'

export const TxChecks = ({
  safeTx,
  isRejection,
  isCounterfactualSafe,
}: {
  safeTx: ReturnType<typeof useSafeTx>
  isRejection: ReturnType<typeof useIsRejection>
  isCounterfactualSafe: ReturnType<typeof useIsCounterfactualSafe>
}): ReactElement | null => {
  if (isCounterfactualSafe || isRejection || !safeTx) {
    return null
  }

  return <TxChecksComponent transaction={safeTx} />
}

const useSafeTx = () => useContext(SafeTxContext).safeTx
const useIsRejection = () => useContext(TxFlowContext).isRejection

export default madProps(TxChecks, {
  safeTx: useSafeTx,
  isRejection: useIsRejection,
  isCounterfactualSafe: useIsCounterfactualSafe,
})
