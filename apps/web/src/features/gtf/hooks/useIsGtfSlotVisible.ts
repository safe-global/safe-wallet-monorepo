import { useContext } from 'react'
import { useHasFeature } from '@/hooks/useChains'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { FEATURES } from '@safe-global/utils/utils/chains'

export const useIsGtfSlotVisible = (): boolean => {
  const { gasPaymentOption } = useContext(TxFlowContext)
  const isGtfEnabled = !!useHasFeature(FEATURES.GTF)
  return isGtfEnabled && (gasPaymentOption === undefined || gasPaymentOption === 'WALLET')
}
