import type { ReactElement } from 'react'
import { useLoadFeature } from '@/features/__core__'
import { GTFFeature, useFeesPreview, useIsGtfSlotVisible } from '@/features/gtf'
import { SlotName, withSlot } from '../slots'

const FeesPreview = (): ReactElement => {
  const { FeesPreview: FeesPreviewComponent } = useLoadFeature(GTFFeature)
  const feesData = useFeesPreview()

  return <FeesPreviewComponent {...feesData} />
}

const FeesPreviewSlot = withSlot({
  Component: FeesPreview,
  slotName: SlotName.Main,
  id: 'feesPreview',
  useSlotCondition: useIsGtfSlotVisible,
})

export default FeesPreviewSlot
