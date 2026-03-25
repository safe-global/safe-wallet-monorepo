import { useContext } from 'react'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { GTFFeature } from '@/features/gtf'

export const useIsGtfSlotVisible = (): boolean => {
  const { isRejection } = useContext(TxFlowContext)
  const isGtfEnabled = GTFFeature.useIsEnabled()
  return !isRejection && !!isGtfEnabled
}
