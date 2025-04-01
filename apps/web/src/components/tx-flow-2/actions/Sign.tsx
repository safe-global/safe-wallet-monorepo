import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'
import { useCallback, useContext, useState } from 'react'
import { TxFlowContext } from '../TxFlowProvider'
import SignFormV2 from '@/components/tx/SignOrExecuteForm/SignFormV2'
import type { SubmitCallback } from '../../tx-flow/createTxFlow'
import { withCheckboxGuard } from '../withCheckboxGuard'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'

type SignProps = {
  txId?: string
  onSubmit: SubmitCallback
}

export const SIGN_CHECKBOX_LABEL = "I understand what I'm signing and that this is an irreversible action."
export const SIGN_CHECKBOX_TOOLTIP = 'Review details and check the box to enable signing'

const CheckboxGuardedSignForm = withCheckboxGuard(SignFormV2, SIGN_CHECKBOX_LABEL, SIGN_CHECKBOX_TOOLTIP)

const Sign = ({ txId, onSubmit }: SignProps) => {
  const [checked, setChecked] = useState(false)
  const { safeTx, txOrigin } = useContext(SafeTxContext)
  const { willExecute, isProposing, willExecuteThroughRole, trackTxEvent, isSubmittable } = useContext(TxFlowContext)
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

  if (!safeTx || isCounterfactualSafe || willExecute || willExecuteThroughRole || isProposing) {
    return null
  }

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

export default Sign
