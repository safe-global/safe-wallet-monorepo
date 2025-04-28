import madProps from '@/utils/mad-props'
import { type ReactElement, type SyntheticEvent, useContext, useMemo, useState } from 'react'
import { CircularProgress, Box, Button, Divider, Tooltip } from '@mui/material'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { trackError, Errors } from '@/services/exceptions'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import CheckWallet from '@/components/common/CheckWallet'
import { useAlreadySigned, useTxActions } from './hooks'
import type { SignOrExecuteProps } from './SignOrExecuteForm'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { TxModalContext } from '@/components/tx-flow'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import { TxSecurityContext } from '../security/shared/TxSecurityContext'
import NonOwnerError from '@/components/tx/SignOrExecuteForm/NonOwnerError'
import WalletRejectionError from '@/components/tx/SignOrExecuteForm/WalletRejectionError'
import BatchButton from '@/components/tx-flow/actions/Batching/BatchButton'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { isWalletRejection } from '@/utils/wallets'
import { useSigner } from '@/hooks/wallets/useWallet'
import { NestedTxSuccessScreenFlow } from '@/components/tx-flow/flows'
import { useValidateTxData } from '@/hooks/useValidateTxData'
import { TxCardActions } from '@/components/tx-flow/common/TxCard'

export const SignForm = ({
  safeTx,
  txId,
  onSubmit,
  disableSubmit = false,
  origin,
  isBatch,
  isBatchable,
  isCreation,
  isOwner,
  txActions,
  txSecurity,
  tooltip,
}: SignOrExecuteProps & {
  isOwner: ReturnType<typeof useIsSafeOwner>
  txActions: ReturnType<typeof useTxActions>
  txSecurity: ReturnType<typeof useTxSecurityContext>
  isCreation?: boolean
  safeTx?: SafeTransaction
  tooltip?: string
}): ReactElement => {
  // Form state
  const [isSubmittable, setIsSubmittable] = useState<boolean>(true)
  const [submitError, setSubmitError] = useState<Error | undefined>()
  const [isRejectedByUser, setIsRejectedByUser] = useState<Boolean>(false)

  const [validationResult, , validationLoading] = useValidateTxData(txId)
  const validationError = useMemo(
    () => (validationResult !== undefined ? new Error(validationResult) : undefined),
    [validationResult],
  )

  // Hooks
  const { signTx, addToBatch } = txActions
  const { setTxFlow } = useContext(TxModalContext)
  const { needsRiskConfirmation, isRiskConfirmed, setIsRiskIgnored } = txSecurity
  const hasSigned = useAlreadySigned(safeTx)
  const signer = useSigner()

  // On modal submit
  const handleSubmit = async (e: SyntheticEvent, isAddingToBatch = false) => {
    e.preventDefault()

    if (needsRiskConfirmation && !isRiskConfirmed) {
      setIsRiskIgnored(true)
      return
    }

    if (!safeTx || validationError) return

    setIsSubmittable(false)
    setSubmitError(undefined)
    setIsRejectedByUser(false)

    let resultTxId: string
    try {
      resultTxId = await (isAddingToBatch ? addToBatch(safeTx, origin) : signTx(safeTx, txId, origin))
    } catch (_err) {
      const err = asError(_err)
      if (isWalletRejection(err)) {
        setIsRejectedByUser(true)
      } else {
        trackError(Errors._804, err)
        setSubmitError(err)
      }
      setIsSubmittable(true)
      return
    }

    // On successful sign
    if (!isAddingToBatch) {
      onSubmit?.(resultTxId)
    }

    if (!isAddingToBatch && signer?.isSafe) {
      setTxFlow(<NestedTxSuccessScreenFlow txId={resultTxId} />, undefined, false)
    } else {
      setTxFlow(undefined)
    }
  }

  const onBatchClick = (e: SyntheticEvent) => {
    handleSubmit(e, true)
  }

  const cannotPropose = !isOwner
  const submitDisabled =
    !safeTx ||
    !isSubmittable ||
    disableSubmit ||
    cannotPropose ||
    (needsRiskConfirmation && !isRiskConfirmed) ||
    validationError !== undefined ||
    validationLoading

  return (
    <form onSubmit={handleSubmit}>
      {hasSigned && <ErrorMessage level="warning">You have already signed this transaction.</ErrorMessage>}

      {cannotPropose ? (
        <NonOwnerError />
      ) : (
        submitError && (
          <ErrorMessage error={submitError}>Error submitting the transaction. Please try again.</ErrorMessage>
        )
      )}

      {isRejectedByUser && (
        <Box mt={1}>
          <WalletRejectionError />
        </Box>
      )}

      {validationError !== undefined && (
        <ErrorMessage error={validationError}>Error validating transaction data</ErrorMessage>
      )}

      <Divider className={commonCss.nestedDivider} sx={{ pt: 3 }} />

      <TxCardActions>
        {/* Batch button */}
        {isCreation && !isBatch && (
          <BatchButton
            onClick={onBatchClick}
            disabled={submitDisabled || !isBatchable}
            tooltip={!isBatchable ? `Cannot batch this type of transaction` : undefined}
          />
        )}

        {/* Submit button */}
        <CheckWallet checkNetwork={!submitDisabled}>
          {(isOk) => (
            <Tooltip title={tooltip} placement="top">
              <span>
                <Button
                  data-testid="sign-btn"
                  variant="contained"
                  type="submit"
                  disabled={!isOk || submitDisabled}
                  sx={{ minWidth: '82px', order: '1', width: ['100%', '100%', '100%', 'auto'] }}
                >
                  {!isSubmittable ? <CircularProgress size={20} /> : 'Sign'}
                </Button>
              </span>
            </Tooltip>
          )}
        </CheckWallet>
      </TxCardActions>
    </form>
  )
}

const useTxSecurityContext = () => useContext(TxSecurityContext)

export default madProps(SignForm, {
  isOwner: useIsSafeOwner,
  txActions: useTxActions,
  txSecurity: useTxSecurityContext,
})
