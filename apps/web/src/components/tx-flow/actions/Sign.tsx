import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'
import { useCallback, useContext, useState } from 'react'
import { TxFlowContext } from '../TxFlowProvider'
import SignFormV2 from '@/components/tx/SignOrExecuteForm/SignFormV2'
import { withCheckboxGuard } from '../withCheckboxGuard'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import type { ActionComponent } from '../withActions'

export const SIGN_CHECKBOX_LABEL = "I understand what I'm signing and that this is an irreversible action."
export const SIGN_CHECKBOX_TOOLTIP = 'Review details and check the box to enable signing'

const CheckboxGuardedSignForm = withCheckboxGuard(SignFormV2, SIGN_CHECKBOX_LABEL, SIGN_CHECKBOX_TOOLTIP)

const Sign: ActionComponent = ({ onSubmit, children = false }) => {
  const [checked, setChecked] = useState(false)
  const { safeTx, txOrigin } = useContext(SafeTxContext)
  const { txId, willExecute, isProposing, willExecuteThroughRole, trackTxEvent, isSubmittable } =
    useContext(TxFlowContext)
  const isCounterfactualSafe = useIsCounterfactualSafe()

  const handleCheckboxChange = useCallback((checked: boolean) => {
    setChecked(checked)
    trackEvent({ ...MODALS_EVENTS.CONFIRM_SIGN_CHECKBOX, label: checked })
  }, [])

  const handleSubmit = useCallback(
    async (txId: string, isExecuted = false) => {
      onSubmit({ txId, isExecuted })
      trackTxEvent(txId, isExecuted)
    },
    [onSubmit, trackTxEvent],
  )

  if (safeTx && !isCounterfactualSafe && !willExecute && !willExecuteThroughRole && !isProposing) {
    return (
      <CheckboxGuardedSignForm
        disableSubmit={!isSubmittable}
        origin={txOrigin}
        safeTx={safeTx}
        onSubmit={handleSubmit}
        isChecked={checked}
        onCheckboxChange={handleCheckboxChange}
        txId={txId}
      />
    )
  }

  return children
}

export default Sign
