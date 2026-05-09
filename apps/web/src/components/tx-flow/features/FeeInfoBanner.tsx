import type { ReactElement } from 'react'
import { useLoadFeature } from '@/features/__core__'
import { GTFFeature, useIsGtfSlotVisible } from '@/features/gtf'
import { SlotName, withSlot } from '../slots'

const FeeInfoBanner = (): ReactElement => {
  const { FeeInfoBanner: FeeInfoBannerComponent } = useLoadFeature(GTFFeature)

  return <FeeInfoBannerComponent />
}

const FeeInfoBannerSlot = withSlot({
  Component: FeeInfoBanner,
  slotName: SlotName.Sidebar,
  id: 'feeInfoBanner',
  useSlotCondition: useIsGtfSlotVisible,
})

export default FeeInfoBannerSlot
