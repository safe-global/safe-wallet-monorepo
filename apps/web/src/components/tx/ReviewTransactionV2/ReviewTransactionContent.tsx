import useSafeInfo from '@/hooks/useSafeInfo'
import type { PropsWithChildren, SyntheticEvent, ReactElement, ReactNode } from 'react'
import { useState, useContext, useCallback } from 'react'
import madProps from '@/utils/mad-props'
import ExecuteCheckbox from '../ExecuteCheckbox'
import { useImmediatelyExecutable, useTxActions } from '../SignOrExecuteForm/hooks'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import ErrorMessage from '../ErrorMessage'
import TxCard from '@/components/tx-flow/common/TxCard'
import ConfirmationTitle, { ConfirmationTitleTypes } from '@/components/tx/SignOrExecuteForm/ConfirmationTitle'
import { ErrorBoundary } from '@sentry/react'
import ApprovalEditor from '../ApprovalEditor'
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
import CheckWallet from '@/components/common/CheckWallet'
import { TxFlowContext } from '@/components/tx-flow-2/TxFlowProvider'

export type ReviewTransactionContentProps = PropsWithChildren<{
  onSubmit?: () => void
  isRejection?: boolean
  isBatch?: boolean
  isBatchable?: boolean
  actions?: ReactNode
}>

export const ReviewTransactionContent = ({
  safeTx,
  safeTxError,
  onSubmit,
  isBatch,
  txActions,
  isOwner,
  actions,
  txOrigin,
  setTxOrigin,
  ...props
}: ReviewTransactionContentProps & {
  isOwner: ReturnType<typeof useIsSafeOwner>
  txActions: ReturnType<typeof useTxActions>
  safeTx: ReturnType<typeof useSafeTx>
  safeTxError: ReturnType<typeof useSafeTxError>
  txOrigin: ReturnType<typeof useTxOrigin>
  setTxOrigin: ReturnType<typeof useSetTxOrigin>
  isCreation?: boolean
  txDetails?: TransactionDetails
  txPreview?: TransactionPreview
  txId?: string
}): ReactElement => {
  const {
    canExecute,
    onlyExecute,
    willExecute,
    isCreation,
    setShouldExecute,
    showMethodCall,
    isSubmittable,
    isProposing,
  } = useContext(TxFlowContext)
  const [customOrigin, setCustomOrigin] = useState<string | undefined>(txOrigin)
  const isNewExecutableTx = useImmediatelyExecutable() && isCreation

  const [readableApprovals] = useApprovalInfos({ safeTransaction: safeTx })
  const isApproval = readableApprovals && readableApprovals.length > 0
  const { safe } = useSafeInfo()
  const isSafeOwner = useIsSafeOwner()
  const isCounterfactualSafe = !safe.deployed

  // Check if a Zodiac Roles mod is enabled and if the user is a member of any role that allows the transaction
  const roles = useRoles(
    !isCounterfactualSafe && isCreation && !(isNewExecutableTx && isSafeOwner) ? safeTx : undefined,
  )
  const allowingRole = findAllowingRole(roles)
  const mostLikelyRole = findMostLikelyRole(roles)
  const canExecuteThroughRole = !!allowingRole || (!!mostLikelyRole && !isSafeOwner)

  const onContinueClick = useCallback(
    async (e: SyntheticEvent) => {
      e.preventDefault()

      if (customOrigin !== txOrigin) {
        trackAddNote()
      }

      setTxOrigin(customOrigin)
      onSubmit?.()
    },
    [onSubmit, customOrigin, txOrigin, setTxOrigin],
  )

  const onNoteChange = useCallback(
    (note: string) => {
      setCustomOrigin(encodeTxNote(note, txOrigin))
    },
    [setCustomOrigin, txOrigin],
  )

  const submitDisabled = !safeTx || !isSubmittable

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
          showMethodCall={showMethodCall}
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

        {(canExecute || canExecuteThroughRole) && !onlyExecute && !isCounterfactualSafe && !isProposing && (
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
            {/* Additional actions */}
            {actions}

            {/* Continue button */}
            <CheckWallet allowNonOwner={onlyExecute} checkNetwork={!submitDisabled}>
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
const useTxOrigin = () => useContext(SafeTxContext).txOrigin
const useSetTxOrigin = () => useContext(SafeTxContext).setTxOrigin

export default madProps(ReviewTransactionContent, {
  isOwner: useIsSafeOwner,
  safeTx: useSafeTx,
  txOrigin: useTxOrigin,
  setTxOrigin: useSetTxOrigin,
  safeTxError: useSafeTxError,
  txActions: useTxActions,
})
