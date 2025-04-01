import { useIsWalletProposer } from '@/hooks/useProposers'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { SyntheticEvent } from 'react'
import { type ReactElement, type ReactNode, useState, useContext, useCallback } from 'react'
import madProps from '@/utils/mad-props'
import ExecuteCheckbox from '../ExecuteCheckbox'
import { useImmediatelyExecutable, useValidateNonce, useTxActions } from '../SignOrExecuteForm/hooks'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import ErrorMessage from '../ErrorMessage'
import TxCard from '@/components/tx-flow/common/TxCard'
import ConfirmationTitle, { ConfirmationTitleTypes } from '@/components/tx/SignOrExecuteForm/ConfirmationTitle'
import { useAppSelector } from '@/store'
import { selectSettings } from '@/store/settingsSlice'
import { ErrorBoundary } from '@sentry/react'
import ApprovalEditor from '../ApprovalEditor'
import { isDelegateCall } from '@/services/tx/tx-sender/sdk'
import { findAllowingRole, findMostLikelyRole, useRoles } from '../SignOrExecuteForm/ExecuteThroughRoleForm/hooks'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { BlockaidBalanceChanges } from '../security/blockaid/BlockaidBalanceChange'
import { Blockaid } from '../security/blockaid'
import { useApprovalInfos } from '../ApprovalEditor/hooks/useApprovalInfos'
import type { TransactionDetails, TransactionPreview } from '@safe-global/safe-gateway-typescript-sdk'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import ConfirmationView from '../confirmation-views'
import { TxNoteForm, encodeTxNote, trackAddNote } from '@/features/tx-notes'
import { SignerForm } from '../SignOrExecuteForm/SignerForm'
import UnknownContractError from '../SignOrExecuteForm/UnknownContractError'
import TxChecks from '../SignOrExecuteForm/TxChecks'
import { Button, CardActions, CircularProgress, Stack } from '@mui/material'
import BatchButton from '../SignOrExecuteForm/BatchButton'
import { TxModalContext } from '@/components/tx-flow'
import CheckWallet from '@/components/common/CheckWallet'

export type ReviewTransactionContentProps = {
  txId?: string
  onSubmit?: () => void
  children?: ReactNode
  isExecutable?: boolean
  isRejection?: boolean
  isBatch?: boolean
  isBatchable?: boolean
  onlyExecute?: boolean
  disableSubmit?: boolean
  origin?: string
  showMethodCall?: boolean
}

export const ReviewTransactionContent = ({
  safeTx,
  safeTxError,
  onSubmit,
  isCreation,
  isBatch,
  txActions,
  disableSubmit,
  isOwner,
  ...props
}: ReviewTransactionContentProps & {
  isOwner: ReturnType<typeof useIsSafeOwner>
  txActions: ReturnType<typeof useTxActions>
  safeTx: ReturnType<typeof useSafeTx>
  safeTxError: ReturnType<typeof useSafeTxError>
  isCreation?: boolean
  txDetails?: TransactionDetails
  txPreview?: TransactionPreview
}): ReactElement => {
  const [customOrigin, setCustomOrigin] = useState<string | undefined>(props.origin)
  const [isSubmittable, setIsSubmittable] = useState<boolean>(true)
  const { transactionExecution } = useAppSelector(selectSettings)
  const [shouldExecute, setShouldExecute] = useState<boolean>(transactionExecution)
  const isNewExecutableTx = useImmediatelyExecutable() && isCreation
  const isCorrectNonce = useValidateNonce(safeTx)
  const isBatchable = props.isBatchable !== false && safeTx && !isDelegateCall(safeTx)
  const { setTxFlow } = useContext(TxModalContext)
  const { setTxOrigin } = useContext(SafeTxContext)

  const { addToBatch } = txActions

  const [readableApprovals] = useApprovalInfos({ safeTransaction: safeTx })
  const isApproval = readableApprovals && readableApprovals.length > 0
  const { safe } = useSafeInfo()
  const isSafeOwner = useIsSafeOwner()
  const isProposer = useIsWalletProposer()
  const isProposing = isProposer && !isSafeOwner && isCreation
  const isCounterfactualSafe = !safe.deployed

  // Check if a Zodiac Roles mod is enabled and if the user is a member of any role that allows the transaction
  const roles = useRoles(
    !isCounterfactualSafe && isCreation && !(isNewExecutableTx && isSafeOwner) ? safeTx : undefined,
  )
  const allowingRole = findAllowingRole(roles)
  const mostLikelyRole = findMostLikelyRole(roles)
  const canExecuteThroughRole = !!allowingRole || (!!mostLikelyRole && !isSafeOwner)
  const preferThroughRole = canExecuteThroughRole && !isSafeOwner // execute through role if a non-owner role member wallet is connected

  // If checkbox is checked and the transaction is executable, execute it, otherwise sign it
  const canExecute = isCorrectNonce && (props.isExecutable || isNewExecutableTx)
  const willExecute = (props.onlyExecute || shouldExecute) && canExecute && !preferThroughRole
  const willExecuteThroughRole =
    (props.onlyExecute || shouldExecute) && canExecuteThroughRole && (!canExecute || preferThroughRole)

  const onContinueClick = useCallback(
    async (e: SyntheticEvent) => {
      e.preventDefault()

      if (customOrigin !== props.origin) {
        trackAddNote()
      }

      setTxOrigin(customOrigin)
      onSubmit?.()
    },
    [onSubmit, customOrigin, props.origin, setTxOrigin],
  )

  const onNoteChange = useCallback(
    (note: string) => {
      setCustomOrigin(encodeTxNote(note, props.origin))
    },
    [setCustomOrigin, props.origin],
  )

  const onBatchClick = async (e: SyntheticEvent) => {
    e.preventDefault()

    if (!safeTx) return

    setIsSubmittable(false)

    await addToBatch(safeTx, customOrigin)

    setIsSubmittable(true)

    setTxFlow(undefined)
  }

  const submitDisabled = !safeTx || !isSubmittable || disableSubmit

  const showBatchButton =
    isOwner &&
    isCreation &&
    !isBatch &&
    !isCounterfactualSafe &&
    !willExecute &&
    !willExecuteThroughRole &&
    !isProposing

  return (
    <>
      <TxCard>
        {props.children}

        <ConfirmationView
          txId={props.txId}
          isCreation={isCreation}
          txDetails={props.txDetails}
          txPreview={props.txPreview}
          safeTx={safeTx}
          isBatch={isBatch}
          showMethodCall={props.showMethodCall}
          isApproval={isApproval}
        >
          {!props.isRejection && (
            <ErrorBoundary fallback={<div>Error parsing data</div>}>
              {isApproval && <ApprovalEditor safeTransaction={safeTx} />}
            </ErrorBoundary>
          )}
        </ConfirmationView>

        {!isCounterfactualSafe && !props.isRejection && <BlockaidBalanceChanges />}
      </TxCard>

      {!isCounterfactualSafe && !props.isRejection && safeTx && <TxChecks transaction={safeTx} />}

      <TxNoteForm isCreation={isCreation ?? false} onChange={onNoteChange} txDetails={props.txDetails} />

      <SignerForm willExecute={willExecute} />

      <TxCard>
        <ConfirmationTitle
          variant={
            isProposing
              ? ConfirmationTitleTypes.propose
              : willExecute
                ? ConfirmationTitleTypes.execute
                : ConfirmationTitleTypes.sign
          }
          isCreation={isCreation}
        />

        {safeTxError && (
          <ErrorMessage error={safeTxError}>
            This transaction will most likely fail. To save gas costs, avoid confirming the transaction.
          </ErrorMessage>
        )}

        {(canExecute || canExecuteThroughRole) && !props.onlyExecute && !isCounterfactualSafe && !isProposing && (
          <ExecuteCheckbox onChange={setShouldExecute} />
        )}

        <NetworkWarning />

        <UnknownContractError txData={props.txDetails?.txData ?? props.txPreview?.txData} />

        <Blockaid />

        <CardActions>
          <Stack
            sx={{
              width: ['100%', '100%', '100%', 'auto'],
            }}
            direction={{ xs: 'column-reverse', lg: 'row' }}
            spacing={{ xs: 2, md: 2 }}
          >
            {/* Batch button */}
            {showBatchButton && (
              <BatchButton
                onClick={onBatchClick}
                disabled={submitDisabled || !isBatchable}
                tooltip={!isBatchable ? `Cannot batch this type of transaction` : undefined}
              />
            )}

            {/* Continue button */}
            <CheckWallet allowNonOwner={props.onlyExecute} checkNetwork={!submitDisabled}>
              {(isOk) => (
                <Button
                  data-testid="continue-sign-btn"
                  variant="contained"
                  type="submit"
                  onClick={onContinueClick}
                  disabled={!isOk || submitDisabled}
                  sx={{ minWidth: '82px', order: '1', width: ['100%', '100%', '100%', 'auto'] }}
                >
                  {!isSubmittable ? <CircularProgress size={20} /> : 'Continue'}
                </Button>
              )}
            </CheckWallet>
          </Stack>
        </CardActions>
      </TxCard>
    </>
  )
}

const useSafeTx = () => useContext(SafeTxContext).safeTx
const useSafeTxError = () => useContext(SafeTxContext).safeTxError

export default madProps(ReviewTransactionContent, {
  isOwner: useIsSafeOwner,
  safeTx: useSafeTx,
  safeTxError: useSafeTxError,
  txActions: useTxActions,
})
