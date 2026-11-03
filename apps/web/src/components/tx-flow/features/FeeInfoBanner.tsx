import type { ReactElement } from 'react'
import { useLoadFeature } from '@/features/__core__/useLoadFeature'
import { GTFFeature } from '@/features/gtf'
import { useIsGtfSlotVisible } from '@/features/gtf/hooks/useIsGtfSlotVisible'
import { IS_RELAYING_LIVE } from '@/features/gtf/constants'
import { SlotName } from '@safe-global/views/components/tx-flow/slots/SlotProvider'
import { withSlot } from '../slots/withSlot'

const FeeInfoBanner = (): ReactElement => {
  const { FeeInfoBanner: FeeInfoBannerComponent } = useLoadFeature(GTFFeature)

  return <FeeInfoBannerComponent />
}

const FeeInfoBannerSlot = withSlot({
  Component: FeeInfoBanner,
  slotName: SlotName.Sidebar,
  id: 'feeInfoBanner',
  useSlotCondition: () => useIsGtfSlotVisible() && IS_RELAYING_LIVE,
})

export default FeeInfoBannerSlot
