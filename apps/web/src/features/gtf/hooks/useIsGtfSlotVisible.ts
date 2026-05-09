import { useContext } from 'react'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

export const useIsGtfSlotVisible = (): boolean => {
  const { isRejection } = useContext(TxFlowContext)
  const isGtfEnabled = useHasFeature(FEATURES.GTF)
  return !isRejection && !!isGtfEnabled
}
