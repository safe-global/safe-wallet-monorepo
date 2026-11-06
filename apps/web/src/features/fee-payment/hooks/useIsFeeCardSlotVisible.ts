import { useContext } from 'react'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { useCurrentChain } from '@/hooks/useChains'

/** Shown on every known chain, except while an execute form (which sets `gasPaymentOption`) owns the fees. */
export const useIsFeeCardSlotVisible = (): boolean => {
  const { gasPaymentOption } = useContext(TxFlowContext)
  const chain = useCurrentChain()
  return !!chain && gasPaymentOption === undefined
}
