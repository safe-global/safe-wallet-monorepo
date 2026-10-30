import { useContext } from 'react'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { useCurrentChain } from '@/hooks/useChains'

/**
 * The fee card is shown on every chain once it is known: options the chain's relayer does not offer
 * render locked rather than hidden. It renders only while no execute form is mounted: once one is,
 * its gas payer selector owns the decision (sponsored / pay from Safe / wallet) and shows the fees
 * itself. An execute form publishes `gasPaymentOption` for as long as it is mounted, whatever the option.
 */
export const useIsFeeCardSlotVisible = (): boolean => {
  const { gasPaymentOption } = useContext(TxFlowContext)
  const chain = useCurrentChain()
  return !!chain && gasPaymentOption === undefined
}
