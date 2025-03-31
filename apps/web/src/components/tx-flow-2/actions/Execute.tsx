import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useCallback, useContext, useState } from 'react'
import { TxFlowContext } from '../TxFlowProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { SubmitCallback } from '../createTxFlow'
import ExecuteForm from '@/components/tx/SignOrExecuteForm/ExecuteForm'
import { useAlreadySigned } from '@/components/tx/SignOrExecuteForm/hooks'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'
import { withCheckboxGuard } from '../withCheckboxGuard'
import { SIGN_CHECKBOX_LABEL, SIGN_CHECKBOX_TOOLTIP } from './Sign'

type ExecuteProps = {
  txId?: string
  disableSubmit?: boolean
  onSubmit: SubmitCallback
}

const CheckboxGuardedExecuteForm = withCheckboxGuard(ExecuteForm, SIGN_CHECKBOX_LABEL, SIGN_CHECKBOX_TOOLTIP)

const Execute = ({ txId, disableSubmit, onSubmit }: ExecuteProps) => {
  const { safe } = useSafeInfo()
  const { safeTx, txOrigin } = useContext(SafeTxContext)
  const { isCreation, willExecute, isProposing, onlyExecute, trackTxEvent } = useContext(TxFlowContext)
  const isCounterfactualSafe = !safe.deployed
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

  if (isCounterfactualSafe || !willExecute || isProposing) {
    return null
  }

  const ExecuteFormComponent = hasSigned ? ExecuteForm : CheckboxGuardedExecuteForm

  return (
    <ExecuteFormComponent
      safeTx={safeTx}
      txId={txId}
      onSubmit={handleSubmit}
      onCheckboxChange={handleCheckboxChange}
      isChecked={checked}
      disableSubmit={disableSubmit}
      origin={txOrigin}
      onlyExecute={onlyExecute}
      isCreation={isCreation}
    />
  )
}

export default Execute
