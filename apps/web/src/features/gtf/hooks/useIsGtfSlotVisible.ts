import { useContext } from 'react'
import { useHasFeature } from '@/hooks/useChains'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { FEATURES } from '@safe-global/utils/utils/chains'

/**
 * The standalone fee card renders only while no execute form is mounted: once one is, its gas payer
 * selector owns the decision (sponsored / pay from Safe / wallet) and shows the fees itself. An
 * execute form publishes `gasPaymentOption` for as long as it is mounted, whatever the option.
 */
export const useIsGtfSlotVisible = (): boolean => {
  const { gasPaymentOption } = useContext(TxFlowContext)
  const isGtfEnabled = !!useHasFeature(FEATURES.GTF)
  return isGtfEnabled && gasPaymentOption === undefined
}
