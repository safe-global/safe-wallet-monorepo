import { useContext, useEffect } from 'react'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { SlotName, withSlot } from '../slots'
import { FEATURES } from '@/utils/featureToggled'
import { ErrorBoundary } from '@sentry/react'
import { BlockaidWarning } from '@/components/tx/security/blockaid'
import { TxSecurityContext } from '@/components/tx/security/shared/TxSecurityContext'

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
  feature: FEATURES.RISK_MITIGATION,
})

export default BlockaidSlot
