import type { ReactElement } from 'react'
import { useLoadFeature } from '@/features/__core__'
import { GTFFeature, IS_RELAYING_LIVE } from '@/features/gtf'
import { SlotName, withSlot } from '../slots'
import { useIsGtfFeeSlotVisible } from './useIsGtfFeeSlotVisible'

const FeeInfoBanner = (): ReactElement => {
  const { FeeInfoBanner: FeeInfoBannerComponent } = useLoadFeature(GTFFeature)

  return <FeeInfoBannerComponent />
}

const FeeInfoBannerSlot = withSlot({
  Component: FeeInfoBanner,
  slotName: SlotName.Sidebar,
  id: 'feeInfoBanner',
  useSlotCondition: () => useIsGtfFeeSlotVisible() && IS_RELAYING_LIVE,
})

export default FeeInfoBannerSlot
