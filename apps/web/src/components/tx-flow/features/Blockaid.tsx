import { useContext, useEffect } from 'react'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { SlotName, withSlot } from '../slots'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@/utils/featureToggled'
import { ErrorBoundary } from '@sentry/react'
import { BlockaidWarning } from '@/components/tx/security/blockaid'
import { TxSecurityContext } from '@/components/tx/security/shared/TxSecurityContext'

const useShouldRegisterSlot = () => {
  const isFeatureEnabled = useHasFeature(FEATURES.RISK_MITIGATION)
  return !!isFeatureEnabled
}

const BlockaidSlot = withSlot({
  Component: () => {
    const { setIsSubmitDisabled } = useContext(TxFlowContext)
    const { needsRiskConfirmation, isRiskConfirmed } = useContext(TxSecurityContext)

    useEffect(() => {
      setIsSubmitDisabled(needsRiskConfirmation && !isRiskConfirmed)
    }, [needsRiskConfirmation, isRiskConfirmed, setIsSubmitDisabled])

    return (
      <ErrorBoundary fallback={<div>Error showing scan result</div>}>
        <BlockaidWarning />
      </ErrorBoundary>
    )
  },
  slotName: SlotName.Footer,
  id: 'blockaid',
  useSlotCondition: useShouldRegisterSlot,
})

export default BlockaidSlot
