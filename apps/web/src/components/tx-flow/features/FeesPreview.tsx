import type { ReactElement } from 'react'
import { useLoadFeature } from '@/features/__core__'
import { GTFFeature, useFeesPreview, useIsGtfSlotVisible } from '@/features/gtf'
import { useSafeShieldForTxData } from '@/features/safe-shield/SafeShieldContext'
import { SlotName, withSlot } from '../slots'

const FeesPreview = (): ReactElement => {
  const { FeesPreview: FeesPreviewComponent } = useLoadFeature(GTFFeature)
  const feesData = useFeesPreview()

  // Hand the CGW resolved payload to Safe Shield so the threat-analysis simulation runs against
  // the same gasToken/baseGas/gasPrice the user is about to sign. Without this the analyzer sees
  // the bare safeTx (gasToken=0x0, baseGas=0) and misses Safe-pays specific issues like
  // "insufficient gas-token balance to cover the refund" (only surfaced at sign time otherwise).
  useSafeShieldForTxData(feesData.previewedSafeTx)

  return <FeesPreviewComponent {...feesData} />
}

const FeesPreviewSlot = withSlot({
  Component: FeesPreview,
  slotName: SlotName.Main,
  id: 'feesPreview',
  useSlotCondition: useIsGtfSlotVisible,
})

export default FeesPreviewSlot
