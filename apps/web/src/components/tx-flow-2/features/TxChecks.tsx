import type { ReactElement } from 'react'
import { useContext } from 'react'
import madProps from '@/utils/mad-props'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext } from '@/components/tx-flow-2/TxFlowProvider'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import TxChecks from '@/components/tx/SignOrExecuteForm/TxChecks'

export const ReviewTransactionContent = ({
  safeTx,
  isRejection,
}: {
  safeTx: ReturnType<typeof useSafeTx>
  isRejection: ReturnType<typeof useIsRejection>
}): ReactElement | null => {
  const isCounterfactualSafe = useIsCounterfactualSafe()

  if (isCounterfactualSafe || isRejection || !safeTx) {
    return null
  }

  return <TxChecks transaction={safeTx} />
}

const useSafeTx = () => useContext(SafeTxContext).safeTx
const useIsRejection = () => useContext(TxFlowContext).isRejection

export default madProps(ReviewTransactionContent, {
  safeTx: useSafeTx,
  isRejection: useIsRejection,
})
