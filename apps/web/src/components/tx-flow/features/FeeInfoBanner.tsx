import type { ReactElement } from 'react'
import { useIsFeeCardSlotVisible } from '@/features/fee-payment/public/hooks/useIsFeeCardSlotVisible'
import { useIsPayFromSafeEnabled } from '@/features/fee-payment/public/hooks/useIsPayFromSafeEnabled'
import { SlotName } from '@safe-global/views/components/tx-flow/slots/SlotProvider'
import { withSlot } from '@/components/tx-flow/slots/withSlot'
import FeeInfoBannerComponent from '@/features/fee-payment/public/components/FeeInfoBanner'

const FeeInfoBanner = (): ReactElement => {
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
