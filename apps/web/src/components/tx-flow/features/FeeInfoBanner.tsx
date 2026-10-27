import type { ReactElement } from 'react'
import { useLoadFeature } from '@/features/__core__'
import { PayFromSafeFeature, useIsPayFromSafeSlotVisible, IS_RELAYING_LIVE } from '@/features/pay-from-safe'
import { SlotName, withSlot } from '../slots'

const FeeInfoBanner = (): ReactElement => {
  const { FeeInfoBanner: FeeInfoBannerComponent } = useLoadFeature(PayFromSafeFeature)

  return <FeeInfoBannerComponent />
}

const FeeInfoBannerSlot = withSlot({
  Component: FeeInfoBanner,
  slotName: SlotName.Sidebar,
  id: 'feeInfoBanner',
  useSlotCondition: () => useIsPayFromSafeSlotVisible() && IS_RELAYING_LIVE,
})

export default FeeInfoBannerSlot
