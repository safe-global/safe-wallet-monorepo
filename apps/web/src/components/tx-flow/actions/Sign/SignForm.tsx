import madProps from '@/utils/mad-props'
import { type ReactElement, type SyntheticEvent, useContext, useMemo, useState } from 'react'
import { Box, Divider, Stack } from '@mui/material'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { trackError, Errors } from '@/services/exceptions'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import CheckWallet from '@/components/common/CheckWallet'
import { useAlreadySigned, useTxActions } from '@/components/tx/SignOrExecuteForm/hooks'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { TxModalContext } from '@/components/tx-flow'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import { TxSecurityContext } from '@/components/tx/security/shared/TxSecurityContext'
import NonOwnerError from '@/components/tx/SignOrExecuteForm/NonOwnerError'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { isWalletRejection } from '@/utils/wallets'
import { useSigner } from '@/hooks/wallets/useWallet'
import { NestedTxSuccessScreenFlow } from '@/components/tx-flow/flows'
import { useValidateTxData } from '@/hooks/useValidateTxData'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { TxCardActions } from '@/components/tx-flow/common/TxCard'
import SplitMenuButton from '@/components/common/SplitMenuButton'
import { type SlotComponentProps, SlotName } from '../../slots'

export const SignForm = ({
  safeTx,
  txId,
  onSubmit,
  onChange,
  options = [],
  disableSubmit = false,
  origin,
  isOwner,
  txActions,
  txSecurity,
  tooltip,
}: SlotComponentProps<SlotName.ComboSubmit> & {
  txId?: string
  disableSubmit?: boolean
  origin?: string
  isOwner: ReturnType<typeof useIsSafeOwner>
  txActions: ReturnType<typeof useTxActions>
  txSecurity: ReturnType<typeof useTxSecurityContext>
  safeTx?: SafeTransaction
  tooltip?: string
}): ReactElement => {
  // Form state
  const [isSubmittableLocal, setIsSubmittableLocal] = useState<boolean>(true) // TODO: remove this local state and use only the one from TxFlowContext when tx-flow refactor is done

  const [validationResult, , validationLoading] = useValidateTxData(txId)
  const validationError = useMemo(
    () => (validationResult !== undefined ? new Error(validationResult) : undefined),
    [validationResult],
  )

  // Hooks
  const { signTx } = txActions
  const { setTxFlow } = useContext(TxModalContext)
  const { isSubmittable, setIsSubmittable, onNext, onPrev, setSubmitError, setIsRejectedByUser } =
    useContext(TxFlowContext)
  const { needsRiskConfirmation, isRiskConfirmed, setIsRiskIgnored } = txSecurity
  const hasSigned = useAlreadySigned(safeTx)
  const signer = useSigner()

  const handleOptionChange = (option: string) => {
    onChange?.(option)
  }

  // On modal submit
  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault()

    if (needsRiskConfirmation && !isRiskConfirmed) {
      setIsRiskIgnored(true)
      return
    }

    if (!safeTx || validationError) return

    setIsSubmittable(false)
    setIsSubmittableLocal(false)

    setSubmitError(undefined)
    setIsRejectedByUser(false)

    onNext()

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
      onPrev()
      setIsSubmittable(true)
      setIsSubmittableLocal(true)
      return
    }

    // On successful sign
    onSubmit?.({ txId: resultTxId })

    if (signer?.isSafe) {
      setTxFlow(<NestedTxSuccessScreenFlow txId={resultTxId} />, undefined, false)
    } else {
      setTxFlow(undefined)
    }
  }

  const cannotPropose = !isOwner
  const submitDisabled =
    !safeTx ||
    !isSubmittable ||
    !isSubmittableLocal ||
    disableSubmit ||
    cannotPropose ||
    (needsRiskConfirmation && !isRiskConfirmed) ||
    validationError !== undefined ||
    validationLoading

  return (
    <Stack gap={3}>
      {hasSigned && <ErrorMessage level="warning">You have already signed this transaction.</ErrorMessage>}

      {cannotPropose && <NonOwnerError />}

      {validationError !== undefined && (
        <ErrorMessage error={validationError}>Error validating transaction data</ErrorMessage>
      )}

      <Box>
        <Divider className={commonCss.nestedDivider} />

        {/* Submit button */}
        <TxCardActions>
          <form onSubmit={handleSubmit}>
            <CheckWallet checkNetwork={!submitDisabled}>
              {(isOk) => (
                <SplitMenuButton
                  data-testid="sign-btn"
                  selectedOption="sign"
                  onChange={handleOptionChange}
                  options={options}
                  disabled={!isOk || submitDisabled}
                  loading={!isSubmittable || !isSubmittableLocal}
                  tooltip={isOk ? tooltip : undefined}
                />
              )}
            </CheckWallet>
          </form>
        </TxCardActions>
      </Box>
    </Stack>
  )
}

const useTxSecurityContext = () => useContext(TxSecurityContext)

export default madProps(SignForm, {
  isOwner: useIsSafeOwner,
  txActions: useTxActions,
  txSecurity: useTxSecurityContext,
})
