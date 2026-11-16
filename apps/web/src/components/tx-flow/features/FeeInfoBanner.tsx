import type { ReactElement } from 'react'
import { useLoadFeature } from '@/features/__core__'
import { FeePaymentFeature, useIsFeeCardSlotVisible, IS_RELAYING_LIVE } from '@/features/fee-payment'
import { SlotName, withSlot } from '../slots'

const FeeInfoBanner = (): ReactElement => {
  const { FeeInfoBanner: FeeInfoBannerComponent } = useLoadFeature(FeePaymentFeature)

  return <FeeInfoBannerComponent />
}

const FeeInfoBannerSlot = withSlot({
  Component: FeeInfoBanner,
  slotName: SlotName.Sidebar,
  id: 'feeInfoBanner',
  useSlotCondition: () => useIsFeeCardSlotVisible() && IS_RELAYING_LIVE,
})

export default FeeInfoBannerSlot
