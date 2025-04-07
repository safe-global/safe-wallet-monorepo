import madProps from '@/utils/mad-props'
import { type ReactElement, type SyntheticEvent, useContext, useMemo, useState } from 'react'
import { CircularProgress, Box, Button, CardActions, Divider, Tooltip } from '@mui/material'
import Stack from '@mui/system/Stack'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { trackError, Errors } from '@/services/exceptions'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import CheckWallet from '@/components/common/CheckWallet'
import { useAlreadySigned, useTxActions } from './hooks'
import type { SignOrExecuteProps } from './SignOrExecuteFormV2'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { TxModalContext } from '@/components/tx-flow'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import { TxSecurityContext } from '../security/shared/TxSecurityContext'
import NonOwnerError from '@/components/tx/SignOrExecuteForm/NonOwnerError'
import WalletRejectionError from '@/components/tx/SignOrExecuteForm/WalletRejectionError'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { isWalletRejection } from '@/utils/wallets'
import { useSigner } from '@/hooks/wallets/useWallet'
import { NestedTxSuccessScreenFlow } from '@/components/tx-flow/flows'
import { useValidateTxData } from '@/hooks/useValidateTxData'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { TxCardActions } from '@/components/tx-flow/common/TxCard'

export const SignFormV2 = ({
  safeTx,
  txId,
  onSubmit,
  disableSubmit = false,
  origin,
  isOwner,
  txActions,
  txSecurity,
  tooltip,
}: SignOrExecuteProps & {
  isOwner: ReturnType<typeof useIsSafeOwner>
  txActions: ReturnType<typeof useTxActions>
  txSecurity: ReturnType<typeof useTxSecurityContext>
  safeTx?: SafeTransaction
  tooltip?: string
}): ReactElement => {
  // Form state
  const [isSubmittableLocal, setIsSubmittableLocal] = useState<boolean>(true) // TODO: remove this local state and use only the one from TxFlowContext when tx-flow refactor is done
  const [submitError, setSubmitError] = useState<Error | undefined>()
  const [isRejectedByUser, setIsRejectedByUser] = useState<Boolean>(false)

  const [validationResult, , validationLoading] = useValidateTxData(txId)
  const validationError = useMemo(
    () => (validationResult !== undefined ? new Error(validationResult) : undefined),
    [validationResult],
  )

  // Hooks
  const { signTx } = txActions
  const { setTxFlow } = useContext(TxModalContext)
  const { isSubmittable, setIsSubmittable } = useContext(TxFlowContext)
  const { needsRiskConfirmation, isRiskConfirmed, setIsRiskIgnored } = txSecurity
  const hasSigned = useAlreadySigned(safeTx)
  const signer = useSigner()

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
      setIsSubmittable(true)
      setIsSubmittableLocal(true)
      return
    }

    // On successful sign
    onSubmit?.(resultTxId)

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
        {/* Submit button */}
        <CheckWallet checkNetwork={!submitDisabled}>
          {(isOk) => (
            <Tooltip title={isOk ? tooltip : undefined} placement="top">
              <span>
                <Button
                  data-testid="sign-btn"
                  variant="contained"
                  type="submit"
                  disabled={!isOk || submitDisabled}
                  sx={{ minWidth: '82px', order: '1', width: ['100%', '100%', '100%', 'auto'] }}
                >
                  {!isSubmittable || !isSubmittableLocal ? <CircularProgress size={20} /> : 'Sign'}
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

export default madProps(SignFormV2, {
  isOwner: useIsSafeOwner,
  txActions: useTxActions,
  txSecurity: useTxSecurityContext,
})
