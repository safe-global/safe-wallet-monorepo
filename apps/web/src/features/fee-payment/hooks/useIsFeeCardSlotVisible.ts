import { useContext } from 'react'
import { useHasFeature } from '@/hooks/useChains'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { FEATURES } from '@safe-global/utils/utils/chains'

export const useIsFeeCardSlotVisible = (): boolean => {
  const { gasPaymentOption } = useContext(TxFlowContext)
  const isPayFromSafeEnabled = !!useHasFeature(FEATURES.GTF)
  return isPayFromSafeEnabled && (gasPaymentOption === undefined || gasPaymentOption === 'WALLET')
}
