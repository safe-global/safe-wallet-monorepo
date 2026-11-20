import type { ReactElement } from 'react'
import { useIsFeeCardSlotVisible } from '@/features/fee-payment/public/hooks/useIsFeeCardSlotVisible'
import { IS_RELAYING_LIVE } from '@/features/fee-payment/public/constants'
import { SlotName } from '@safe-global/views/components/tx-flow/slots/SlotProvider'
import { withSlot } from '@/components/tx-flow/slots/withSlot'
import FeeInfoBannerComponent from '@/features/fee-payment/public/components/FeeInfoBanner'

const FeeInfoBanner = (): ReactElement => {
  return <FeeInfoBannerComponent />
}

const FeeInfoBannerSlot = withSlot({
  Component: FeeInfoBanner,
  slotName: SlotName.Sidebar,
  id: 'feeInfoBanner',
  useSlotCondition: () => useIsFeeCardSlotVisible() && IS_RELAYING_LIVE,
})

export default FeeInfoBannerSlot
