import type { ReactElement } from 'react'
import { useLoadFeature } from '@/features/__core__'
import { FeePaymentFeature, useIsPayFromSafeEnabled, useIsFeeCardSlotVisible } from '@/features/fee-payment'
import { SlotName, withSlot } from '../slots'

const FeeInfoBanner = (): ReactElement => {
  const { FeeInfoBanner: FeeInfoBannerComponent } = useLoadFeature(FeePaymentFeature)

  return <FeeInfoBannerComponent />
}

const useIsFeeInfoBannerVisible = (): boolean => {
  const isSlotVisible = useIsFeeCardSlotVisible()
  const isPayFromSafeEnabled = !!useIsPayFromSafeEnabled()
  return isSlotVisible && isPayFromSafeEnabled
}

const FeeInfoBannerSlot = withSlot({
  Component: FeeInfoBanner,
  slotName: SlotName.Sidebar,
  id: 'feeInfoBanner',
  useSlotCondition: useIsFeeInfoBannerVisible,
})

export default FeeInfoBannerSlot
