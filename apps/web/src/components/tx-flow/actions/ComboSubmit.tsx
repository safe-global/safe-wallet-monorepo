import { useContext, useMemo } from 'react'
import { Slot, type SlotComponentProps, SlotName, useSlot, useSlotIds, withSlot } from '../slots'
import WalletRejectionError from '@/components/tx/shared/errors/WalletRejectionError'
import ErrorMessage from '@/components/tx/ErrorMessage'
import TxSubmitError from '@/components/tx/TxSubmitError'
import { TxFlowContext } from '../TxFlowProvider'
import { useValidateTxData } from '@/hooks/useValidateTxData'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { SafeTxContext } from '../SafeTxProvider'
import { useAlreadySigned } from '@/components/tx/shared/hooks'
import useSafeInfo from '@/hooks/useSafeInfo'

const COMBO_SUBMIT_ACTION = 'comboSubmitAction'
const EXECUTE_ACTION = 'execute'
const EXECUTE_THROUGH_ROLE_ACTION = 'executeThroughRole'
const SIGN_ACTION = 'sign'

// Priority order for auto-selection when no stored preference exists
const AUTO_SELECT_PRIORITY = [EXECUTE_ACTION, EXECUTE_THROUGH_ROLE_ACTION]

const resolveSlotId = (slotIds: string[], storedAction: string | undefined): string | undefined => {
  // Respect the user's stored choice if it's still available
  if (storedAction !== undefined && slotIds.includes(storedAction)) {
    return storedAction
  }
  // Otherwise pick the highest-priority available action, falling back to the first slot
  return AUTO_SELECT_PRIORITY.find((id) => slotIds.includes(id)) ?? slotIds[0]
}

export const ComboSubmit = (props: SlotComponentProps<SlotName.Submit>) => {
  const { txId, submitError, isRejectedByUser } = useContext(TxFlowContext)
  const { safeTx } = useContext(SafeTxContext)
  const { safe } = useSafeInfo()
  const slotItems = useSlot(SlotName.ComboSubmit)
  const slotIds = useSlotIds(SlotName.ComboSubmit)

  const [validationResult, , validationLoading] = useValidateTxData(txId)
  const validationError = useMemo(
    () => (validationResult !== undefined ? new Error(validationResult) : undefined),
    [validationResult],
  )

  const hasSigned = useAlreadySigned(safeTx)

  const options = useMemo(() => slotItems.map(({ label, id }) => ({ label, id })), [slotItems])
  const [submitAction, setSubmitAction] = useLocalStorage<string>(COMBO_SUBMIT_ACTION)

  const slotId = useMemo(() => resolveSlotId(slotIds, submitAction), [slotIds, submitAction])

  // Warn when signing completes the threshold. A nested signer (parent Safe) in the split sign/execute
  // flow gets no Execute action at all, so Execute being offered can't gate this — the signature count
  // does, and the resolved action (not the stored preference) tells us the user is about to sign.
  const isLastSignature = !!safeTx && safeTx.signatures.size === safe.threshold - 1
  const showLastSignerWarning = slotId === SIGN_ACTION && !hasSigned && isLastSignature

  if (slotIds.length === 0) {
    return false
  }

  const disabled = validationError !== undefined || validationLoading

  return (
    <>
      {submitError && (
        <div className="mt-2">
          <TxSubmitError error={submitError} context="execution" />
        </div>
      )}

      {isRejectedByUser && (
        <div className="mt-2">
          <WalletRejectionError />
        </div>
      )}

      {validationError !== undefined && <ErrorMessage error={validationError}>{validationError.message}</ErrorMessage>}

      {showLastSignerWarning && (
        <div className="mt-2">
          <ErrorMessage level="info">
            You&apos;re providing the last signature. After you sign, anyone can execute this transaction.
          </ErrorMessage>
        </div>
      )}

      <Slot
        name={SlotName.ComboSubmit}
        id={slotId}
        options={options}
        onChange={setSubmitAction}
        disabled={disabled}
        {...props}
      />
    </>
  )
}

const useShouldRegisterSlot = () => {
  const slotIds = useSlotIds(SlotName.ComboSubmit)
  return slotIds.length > 0
}

const ComboSubmitSlot = withSlot({
  Component: ComboSubmit,
  slotName: SlotName.Submit,
  id: 'combo-submit',
  useSlotCondition: useShouldRegisterSlot,
})

export default ComboSubmitSlot
