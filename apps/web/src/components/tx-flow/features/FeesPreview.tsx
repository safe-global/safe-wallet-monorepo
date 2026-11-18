import { useContext, useEffect, type ReactElement } from 'react'
import { useFeesPreview } from '@/features/fee-payment/public/useFeesPreview'
import { useIsFeeCardSlotVisible } from '@/features/fee-payment/public/useIsFeeCardSlotVisible'
import { useSafeShieldForTxData } from '@/features/safe-shield/public/useSafeShield'
import { TxFlowContext } from '../TxFlowProvider'
import { SlotName } from '@safe-global/views/components/tx-flow/slots/SlotProvider'
import { withSlot } from '@/components/tx-flow/slots/withSlot'
import FeesPreviewComponent from '@/features/fee-payment/public/FeesPreview'

const FeesPreview = (): ReactElement => {
  const feesData = useFeesPreview()
  const { setIsSubmitDisabled } = useContext(TxFlowContext)

  // Block submit while the CGW fee preview is resolving. Otherwise a fast click on Continue/Execute
  // signs before `feeGasToken` is set, silently downgrading a Safe-pays tx to signer-pays.
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
  useSlotCondition: useIsFeeCardSlotVisible,
})

export default FeesPreviewSlot
