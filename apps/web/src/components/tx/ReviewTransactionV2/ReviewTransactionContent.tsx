import type { PropsWithChildren, SyntheticEvent, ReactElement } from 'react'
import { useContext, useCallback } from 'react'
import madProps from '@/utils/mad-props'
import ExecuteCheckbox from '../ExecuteCheckbox'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import ErrorMessage from '../ErrorMessage'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import ConfirmationTitle, { ConfirmationTitleTypes } from '@/components/tx/SignOrExecuteForm/ConfirmationTitle'
import { ErrorBoundary } from '@sentry/react'
import ApprovalEditor from '../ApprovalEditor'
import { BlockaidBalanceChanges } from '../security/blockaid/BlockaidBalanceChange'
import { Blockaid } from '../security/blockaid'
import { useApprovalInfos } from '../ApprovalEditor/hooks/useApprovalInfos'
import type { TransactionDetails, TransactionPreview } from '@safe-global/safe-gateway-typescript-sdk'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import ConfirmationView from '../confirmation-views'
import { SignerForm } from '../SignOrExecuteForm/SignerForm'
import UnknownContractError from '../SignOrExecuteForm/UnknownContractError'
import { Button, CardActions, CircularProgress, Stack } from '@mui/material'
import CheckWallet from '@/components/common/CheckWallet'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import { SlotName, useSlot } from '@/components/tx-flow/slots'

export type ReviewTransactionContentProps = PropsWithChildren<{
  onSubmit: () => void
  isBatch?: boolean
}>

export const ReviewTransactionContent = ({
  safeTx,
  safeTxError,
  onSubmit,
  isBatch,
  children,
  txId,
  txDetails,
  txPreview,
}: ReviewTransactionContentProps & {
  safeTx: ReturnType<typeof useSafeTx>
  safeTxError: ReturnType<typeof useSafeTxError>
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
    isRejection,
    canExecuteThroughRole,
  } = useContext(TxFlowContext)

  const [readableApprovals] = useApprovalInfos({ safeTransaction: safeTx })
  const isApproval = readableApprovals && readableApprovals.length > 0
  const isCounterfactualSafe = useIsCounterfactualSafe()
  const actions = useSlot(SlotName.Action)
  const features = useSlot(SlotName.Feature)

  const onContinueClick = useCallback(
    async (e: SyntheticEvent) => {
      e.preventDefault()
      onSubmit()
    },
    [onSubmit],
  )

  const submitDisabled = !safeTx || !isSubmittable

  return (
    <>
      <TxCard>
        {children}

        <ConfirmationView
          txId={txId}
          isCreation={isCreation}
          txDetails={txDetails}
          txPreview={txPreview}
          safeTx={safeTx}
          isBatch={isBatch}
          showMethodCall={showMethodCall}
          isApproval={isApproval}
        >
          {!isRejection && (
            <ErrorBoundary fallback={<div>Error parsing data</div>}>
              {isApproval && <ApprovalEditor safeTransaction={safeTx} />}
            </ErrorBoundary>
          )}
        </ConfirmationView>

        {!isCounterfactualSafe && !isRejection && <BlockaidBalanceChanges />}
      </TxCard>

      {features.map((Feature, i) => (
        <Feature key={`feature-${i}`} />
      ))}

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

        <UnknownContractError txData={txDetails?.txData ?? txPreview?.txData} />

        <Blockaid />

        <TxCardActions>
          {actions.map((Action, i) => (
            <Action key={`action-${i}`} />
          ))}

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
        </TxCardActions>
      </TxCard>
    </>
  )
}

const useSafeTx = () => useContext(SafeTxContext).safeTx
const useSafeTxError = () => useContext(SafeTxContext).safeTxError

export default madProps(ReviewTransactionContent, {
  safeTx: useSafeTx,
  safeTxError: useSafeTxError,
})
