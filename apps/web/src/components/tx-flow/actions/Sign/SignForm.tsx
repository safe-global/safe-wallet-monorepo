import madProps from '@/utils/mad-props'
import { type ReactElement, type SyntheticEvent, useContext } from 'react'
import { trackError, Errors } from '@/services/exceptions'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import CheckWallet from '@/components/common/CheckWallet'
import { useAlreadySigned, useTxActions } from '@/components/tx/shared/hooks'
import type { SafeTransaction } from '@safe-global/types-kit'
import { TxModalContext } from '@/components/tx-flow'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { isWalletRejection } from '@/utils/wallets'
import { useSigner } from '@/hooks/wallets/useWallet'
import { NestedTxSuccessScreenFlow } from '@/components/tx-flow/flows'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import type { SlotComponentProps, SlotName } from '../../slots'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'
import { SignFormView } from '@views/components/tx-flow/actions/Sign/SignFormView'

export const SignForm = ({
  safeTx,
  txId,
  onSubmit,
  onSubmitSuccess,
  onChange,
  options = [],
  disableSubmit = false,
  origin,
  isOwner,
  slotId,
  txActions,
  txSecurity,
  tooltip,
}: SlotComponentProps<SlotName.ComboSubmit> & {
  txId?: string
  disableSubmit?: boolean
  origin?: string
  isOwner: ReturnType<typeof useIsSafeOwner>
  txActions: ReturnType<typeof useTxActions>
  txSecurity: ReturnType<typeof useSafeShield>
  safeTx?: SafeTransaction
  tooltip?: string
}): ReactElement => {
  // Hooks
  const { signTx } = txActions
  const { setTxFlow } = useContext(TxModalContext)
  const {
    isSubmitDisabled,
    isSubmitLoading,
    setIsSubmitLoading,
    setSubmitError,
    setIsRejectedByUser,
    willSignBeforeExecute,
    continueToExecute,
  } = useContext(TxFlowContext)
  const { needsRiskConfirmation, isRiskConfirmed } = txSecurity
  const hasSigned = useAlreadySigned(safeTx)
  const signer = useSigner()

  const handleOptionChange = (option: string) => {
    onChange?.(option)
  }

  // On modal submit
  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()

    if (!safeTx) return

    setIsSubmitLoading(true)
    setSubmitError(undefined)
    setIsRejectedByUser(false)

    onSubmit?.()

    let resultTxId: string
    try {
      resultTxId = await signTx(safeTx, txId, origin)
    } catch (_err) {
      const err = asError(_err)
      if (isWalletRejection(err)) {
        setIsRejectedByUser(true)
      } else {
        trackError(Errors._804, err)
        setSubmitError(err)
      }
      setIsSubmitLoading(false)
      return
    }

    // On successful sign
    onSubmitSuccess?.({ txId: resultTxId })

    if (willSignBeforeExecute) {
      setIsSubmitLoading(false)
      continueToExecute(resultTxId)
      return
    }

    if (signer?.isSafe) {
      setTxFlow(<NestedTxSuccessScreenFlow txId={resultTxId} />, undefined, false)
    } else {
      setTxFlow(undefined)
    }
  }

  const cannotPropose = !isOwner
  const submitDisabled =
    !safeTx ||
    isSubmitDisabled ||
    isSubmitLoading ||
    disableSubmit ||
    cannotPropose ||
    (needsRiskConfirmation && !isRiskConfirmed)

  return (
    <SignFormView
      onSubmit={handleSubmit}
      hasSigned={hasSigned}
      cannotPropose={cannotPropose}
      renderCheckWallet={(render) => <CheckWallet checkNetwork={!submitDisabled}>{render}</CheckWallet>}
      slotId={slotId}
      onOptionChange={handleOptionChange}
      options={options}
      submitDisabled={submitDisabled}
      isSubmitLoading={isSubmitLoading}
      tooltip={tooltip}
    />
  )
}

export default madProps(SignForm, {
  isOwner: useIsSafeOwner,
  txActions: useTxActions,
  txSecurity: useSafeShield,
})
