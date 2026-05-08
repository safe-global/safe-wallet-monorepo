import madProps from '@/utils/mad-props'
import { type ReactElement, type SyntheticEvent, useContext, useState } from 'react'
import { Box, Divider, Stack } from '@mui/material'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { trackError, Errors } from '@/services/exceptions'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import CheckWallet from '@/components/common/CheckWallet'
import { useAlreadySigned, useTxActions } from '@/components/tx/SignOrExecuteForm/hooks'
import type { SafeTransaction } from '@safe-global/types-kit'
import { TxModalContext } from '@/components/tx-flow'
import commonCss from '@/components/tx-flow/common/styles.module.css'
import NonOwnerError from '@/components/tx/SignOrExecuteForm/NonOwnerError'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { isWalletRejection } from '@/utils/wallets'
import { useSigner } from '@/hooks/wallets/useWallet'
import { NestedTxSuccessScreenFlow } from '@/components/tx-flow/flows'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { TxCardActions } from '@/components/tx-flow/common/TxCard'
import SplitMenuButton from '@/components/common/SplitMenuButton'
import type { SlotComponentProps, SlotName } from '../../slots'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'
import { DelegateCallProposeDisabledError } from '@/services/tx/proposeTransaction'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'

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
  // Form state
  const [isSubmitLoadingLocal, setIsSubmitLoadingLocal] = useState<boolean>(false) // TODO: remove this local state and use only the one from TxFlowContext when tx-flow refactor is done

  // Hooks
  const dispatch = useAppDispatch()
  const { signTx } = txActions
  const { setTxFlow } = useContext(TxModalContext)
  const { isSubmitDisabled, isSubmitLoading, setIsSubmitLoading, setSubmitError, setIsRejectedByUser } =
    useContext(TxFlowContext)
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
    setIsSubmitLoadingLocal(true)

    setSubmitError(undefined)
    setIsRejectedByUser(false)

    onSubmit?.()

    let resultTxId: string
    try {
      resultTxId = await signTx(safeTx, txId, origin)
    } catch (_err) {
      // Signed but backend rejected propose (e.g. delegate call disabled on chain) – treat as success
      if (_err instanceof DelegateCallProposeDisabledError) {
        dispatch(
          showNotification({
            title: 'Transaction signed',
            message: _err.message,
            groupKey: 'delegate-call-signed',
            variant: 'info',
          }),
        )
        setTxFlow(undefined)
        setIsSubmitLoading(false)
        setIsSubmitLoadingLocal(false)
        return
      }

      const err = asError(_err)
      if (isWalletRejection(err)) {
        setIsRejectedByUser(true)
      } else {
        // Use 805 (propose/confirm) when the failure is from proposing; 804 for execution
        const isProposeFailure =
          err.message.toLowerCase().includes('cannot be proposed') ||
          err.message.toLowerCase().includes('delegate call is disabled')
        trackError(isProposeFailure ? Errors._805 : Errors._804, err)
        setSubmitError(err)
      }
      setIsSubmitLoading(false)
      setIsSubmitLoadingLocal(false)
      return
    }

    // On successful sign
    onSubmitSuccess?.({ txId: resultTxId })

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
    isSubmitLoadingLocal ||
    disableSubmit ||
    cannotPropose ||
    (needsRiskConfirmation && !isRiskConfirmed)

  return (
    <Stack gap={3}>
      {hasSigned && <ErrorMessage level="warning">You have already signed this transaction.</ErrorMessage>}

      {cannotPropose && <NonOwnerError />}

      <Box>
        <Divider className={commonCss.nestedDivider} />

        {/* Submit button */}
        <TxCardActions>
          <form onSubmit={handleSubmit}>
            <CheckWallet checkNetwork={!submitDisabled}>
              {(isOk) => (
                <SplitMenuButton
                  selected={slotId}
                  onChange={({ id }) => handleOptionChange(id)}
                  options={options}
                  disabled={!isOk || submitDisabled}
                  loading={isSubmitLoading || isSubmitLoadingLocal}
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

export default madProps(SignForm, {
  isOwner: useIsSafeOwner,
  txActions: useTxActions,
  txSecurity: useSafeShield,
})
