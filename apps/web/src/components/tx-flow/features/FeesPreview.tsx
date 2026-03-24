import type { ReactElement } from 'react'
import { useContext } from 'react'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { useLoadFeature } from '@/features/__core__'
import { GTFFeature, useFeesPreview } from '@/features/gtf'
import { SlotName, withSlot } from '../slots'

const FeesPreview = (): ReactElement => {
  const { FeesPreview: FeesPreviewComponent } = useLoadFeature(GTFFeature)
  const feesData = useFeesPreview()

  return <FeesPreviewComponent {...feesData} />
}

const useShouldRegisterSlot = () => {
  const { isRejection } = useContext(TxFlowContext)
  const isGtfEnabled = GTFFeature.useIsEnabled()
  return !isRejection && !!isGtfEnabled
}

const FeesPreviewSlot = withSlot({
  Component: FeesPreview,
  slotName: SlotName.Main,
  id: 'feesPreview',
  useSlotCondition: useShouldRegisterSlot,
})

export default FeesPreviewSlot
