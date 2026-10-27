import { useContext } from 'react'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { useIsPayFromSafeEnabled } from './useIsPayFromSafeEnabled'

/**
 * The standalone fee card renders only while no execute form is mounted: once one is, its gas payer
 * selector owns the decision (sponsored / pay from Safe / wallet) and shows the fees itself. An
 * execute form publishes `gasPaymentOption` for as long as it is mounted, whatever the option.
 */
export const useIsGtfSlotVisible = (): boolean => {
  const { gasPaymentOption } = useContext(TxFlowContext)
  const isGtfEnabled = !!useIsPayFromSafeEnabled()
  return isGtfEnabled && gasPaymentOption === undefined
}
