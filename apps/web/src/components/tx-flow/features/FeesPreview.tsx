import { useContext, useEffect, type ReactElement } from 'react'
import { useLoadFeature } from '@/features/__core__/useLoadFeature'
import { GTFFeature } from '@/features/gtf'
import { useFeesPreview } from '@/features/gtf/hooks/useFeesPreview'
import { useIsGtfSlotVisible } from '@/features/gtf/hooks/useIsGtfSlotVisible'
import { useSafeShieldForTxData } from '@/features/safe-shield/SafeShieldContext'
import { TxFlowContext } from '../TxFlowProvider'
import { SlotName } from '@safe-global/views/components/tx-flow/slots/SlotProvider'
import { withSlot } from '../slots/withSlot'

const FeesPreview = (): ReactElement => {
  const { FeesPreview: FeesPreviewComponent } = useLoadFeature(GTFFeature)
  const feesData = useFeesPreview()
  const { setIsSubmitDisabled } = useContext(TxFlowContext)

  // Block submit while the CGW fee preview is resolving. Otherwise a fast click on Continue/Execute
  // signs before `gtfSelectedGasToken` is set, silently downgrading a Safe-pays tx to signer-pays.
  useEffect(() => {
    setIsSubmitDisabled(!!feesData.loading)
    return () => setIsSubmitDisabled(false)
  }, [feesData.loading, setIsSubmitDisabled])

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
