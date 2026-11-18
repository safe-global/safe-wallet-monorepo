import type { ReactElement } from 'react'
import { useLoadFeature } from '@/features/__core__/useLoadFeature'
import { FeePaymentFeature } from '@/features/fee-payment'
import { useIsFeeCardSlotVisible } from '@/features/fee-payment/hooks/useIsFeeCardSlotVisible'
import { IS_RELAYING_LIVE } from '@/features/fee-payment/constants'
import { SlotName } from '@safe-global/views/components/tx-flow/slots/SlotProvider'
import { withSlot } from '@/components/tx-flow/slots/withSlot'

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
