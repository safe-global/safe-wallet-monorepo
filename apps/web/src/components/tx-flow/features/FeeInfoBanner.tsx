import type { ReactElement } from 'react'
import { useLoadFeature } from '@/features/__core__'
import { PayFromSafeFeature, useIsPayFromSafeEnabled, useIsFeeCardSlotVisible } from '@/features/pay-from-safe'
import { SlotName, withSlot } from '../slots'

const FeeInfoBanner = (): ReactElement => {
  const { FeeInfoBanner: FeeInfoBannerComponent } = useLoadFeature(PayFromSafeFeature)

  return <FeeInfoBannerComponent />
}

// Unlike the fee card, the banner announces Pay from Safe, so it only shows where the relayer offers it.
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
