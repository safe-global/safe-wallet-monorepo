import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useCallback, useContext, useState } from 'react'
import { TxFlowContext } from '../TxFlowProvider'
import ExecuteForm from '@/components/tx/SignOrExecuteForm/ExecuteForm'
import { useAlreadySigned } from '@/components/tx/SignOrExecuteForm/hooks'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'
import { withCheckboxGuard } from '../withCheckboxGuard'
import { SIGN_CHECKBOX_LABEL, SIGN_CHECKBOX_TOOLTIP } from './Sign'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import type { ActionComponent } from '../withActions'

const CheckboxGuardedExecuteForm = withCheckboxGuard(ExecuteForm, SIGN_CHECKBOX_LABEL, SIGN_CHECKBOX_TOOLTIP)

const Execute: ActionComponent = ({ onSubmit, children = false }) => {
  const { safeTx, txOrigin } = useContext(SafeTxContext)
  const { txId, isCreation, willExecute, isProposing, onlyExecute, isSubmittable, trackTxEvent } =
    useContext(TxFlowContext)
  const isCounterfactualSafe = useIsCounterfactualSafe()
  const hasSigned = useAlreadySigned(safeTx)
  const [checked, setChecked] = useState(false)

  const handleSubmit = useCallback(
    async (txId: string, isExecuted = false) => {
      onSubmit({ txId, isExecuted })
      trackTxEvent(txId, isExecuted)
    },
    [onSubmit, trackTxEvent],
  )

  const handleCheckboxChange = useCallback((checked: boolean) => {
    setChecked(checked)
    trackEvent({ ...MODALS_EVENTS.CONFIRM_SIGN_CHECKBOX, label: checked })
  }, [])

  if (!isCounterfactualSafe && willExecute && !isProposing) {
    const ExecuteFormComponent = hasSigned ? ExecuteForm : CheckboxGuardedExecuteForm

    return (
      <ExecuteFormComponent
        safeTx={safeTx}
        txId={txId}
        onSubmit={handleSubmit}
        onCheckboxChange={handleCheckboxChange}
        isChecked={checked}
        disableSubmit={!isSubmittable}
        origin={txOrigin}
        onlyExecute={onlyExecute}
        isCreation={isCreation}
      />
    )
  }

  return children
}

export default Execute
