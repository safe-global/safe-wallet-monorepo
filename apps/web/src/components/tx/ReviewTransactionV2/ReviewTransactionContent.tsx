import type { TransactionDetails, TransactionPreview } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { PropsWithChildren, ReactElement } from 'react'
import { useCallback, useContext } from 'react'
import madProps from '@/utils/mad-props'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import ErrorMessage from '../ErrorMessage'
import TxCard, { TxCardActions } from '@/components/tx-flow/common/TxCard'
import ConfirmationTitle, { ConfirmationTitleTypes } from '@/components/tx/SignOrExecuteForm/ConfirmationTitle'
import { ErrorBoundary } from '@sentry/react'
import ApprovalEditor from '../ApprovalEditor'
import { useApprovalInfos } from '../ApprovalEditor/hooks/useApprovalInfos'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import ConfirmationView from '../confirmation-views'
import UnknownContractError from '../SignOrExecuteForm/UnknownContractError'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { Slot, SlotName } from '@/components/tx-flow/slots'
import type { SubmitCallback } from '@/components/tx-flow/TxFlow'
import { Button, CircularProgress, Divider } from '@mui/material'
import CheckWallet from '@/components/common/CheckWallet'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'

export type ReviewTransactionContentProps = PropsWithChildren<{ onSubmit: SubmitCallback; withDecodedData?: boolean }>

export const ReviewTransactionContent = ({
  safeTx,
  safeTxError,
  safeShield,
  onSubmit,
  children,
  txDetails,
  txPreview,
  withDecodedData = true,
}: ReviewTransactionContentProps & {
  safeTx: ReturnType<typeof useSafeTx>
  safeTxError: ReturnType<typeof useSafeTxError>
  safeShield: ReturnType<typeof useSafeShield>
  isCreation?: boolean
  txDetails?: TransactionDetails
  txPreview?: TransactionPreview
}): ReactElement => {
  const { willExecute, isBatch, isCreation, isProposing, isRejection, isSubmitLoading, isSubmitDisabled, onlyExecute } =
    useContext(TxFlowContext)
  const { needsRiskConfirmation, isRiskConfirmed } = safeShield
  const [readableApprovals] = useApprovalInfos({ safeTransaction: safeTx })
  const isApproval = readableApprovals && readableApprovals.length > 0

  const onContinueClick = useCallback(() => {
    trackEvent(MODALS_EVENTS.CONTINUE_CLICKED)
    onSubmit()
  }, [onSubmit])

  return (
    <>
      <TxCard>
        {children}

        <ConfirmationView
          isCreation={isCreation}
          txDetails={txDetails}
          txPreview={txPreview}
          safeTx={safeTx}
          isBatch={isBatch}
          isApproval={isApproval}
          withDecodedData={withDecodedData}
        >
          {!isRejection && (
            <ErrorBoundary fallback={<div>Error parsing data</div>}>
              {isApproval && <ApprovalEditor safeTransaction={safeTx} />}
            </ErrorBoundary>
          )}
        </ConfirmationView>

        <Slot name={SlotName.Main} />

        <Divider sx={{ mt: 2, mx: -3 }} />

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

        <Slot name={SlotName.Footer} />
        <NetworkWarning />
        <UnknownContractError txData={txDetails?.txData ?? txPreview?.txData} />

        <TxCardActions>
          {/* Continue button */}
          <CheckWallet allowNonOwner={onlyExecute} checkNetwork={!isSubmitDisabled}>
            {(isOk) => {
              return (
                <Button
                  data-testid="continue-sign-btn"
                  variant="contained"
                  type="submit"
                  onClick={onContinueClick}
                  disabled={!isOk || isSubmitDisabled || (needsRiskConfirmation && !isRiskConfirmed)}
                  sx={{ minWidth: '82px', order: '1', width: ['100%', '100%', '100%', 'auto'] }}
                >
                  {isSubmitLoading ? <CircularProgress size={20} /> : 'Continue'}
                </Button>
              )
            }}
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
  safeShield: useSafeShield,
})
