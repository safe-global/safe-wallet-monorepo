import type { TransactionDetails, TransactionPreview } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { PropsWithChildren, ReactElement } from 'react'
import { useCallback, useContext } from 'react'
import madProps from '@/utils/mad-props'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import TxCheckError from '../TxCheckError'
import ObservabilityErrorBoundary from '@/components/common/ObservabilityErrorBoundary'
import ApprovalEditor from '../ApprovalEditor'
import { useApprovalInfos } from '../ApprovalEditor/hooks/useApprovalInfos'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import ConfirmationView from '../confirmation-views'
import UnknownContractError from '@/components/tx/shared/errors/UnknownContractError'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { Slot, SlotName } from '@/components/tx-flow/slots'
import type { SubmitCallback } from '@/components/tx-flow/TxFlow'
import CheckWallet from '@/components/common/CheckWallet'
import { MODALS_EVENTS, trackEvent } from '@/services/analytics'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'
import {
  ReviewTransactionContentView,
  ReviewTransactionParseErrorView,
} from '@views/components/tx/ReviewTransactionV2/ReviewTransactionContentView'

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
  const { isBatch, isCreation, isRejection, isSubmitLoading, isSubmitDisabled, onlyExecute } = useContext(TxFlowContext)
  const { needsRiskConfirmation, isRiskConfirmed } = safeShield
  const [readableApprovals] = useApprovalInfos({ safeTransaction: safeTx })
  const isApproval = readableApprovals && readableApprovals.length > 0

  const onContinueClick = useCallback(() => {
    trackEvent(MODALS_EVENTS.CONTINUE_CLICKED)
    onSubmit()
  }, [onSubmit])

  return (
    <ReviewTransactionContentView
      confirmationView={
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
            <ObservabilityErrorBoundary fallback={<ReviewTransactionParseErrorView />}>
              {isApproval && <ApprovalEditor safeTransaction={safeTx} />}
            </ObservabilityErrorBoundary>
          )}
        </ConfirmationView>
      }
      mainSlot={<Slot name={SlotName.Main} />}
      txCheckError={safeTxError && <TxCheckError error={safeTxError} />}
      footerSlot={<Slot name={SlotName.Footer} />}
      networkWarning={<NetworkWarning />}
      unknownContractError={<UnknownContractError txData={txDetails?.txData ?? txPreview?.txData} />}
      renderCheckWallet={(render) => (
        <CheckWallet allowNonOwner={onlyExecute} checkNetwork={!isSubmitDisabled}>
          {render}
        </CheckWallet>
      )}
      onContinueClick={onContinueClick}
      isSubmitDisabled={isSubmitDisabled}
      isSubmitLoading={isSubmitLoading}
      isRiskBlocked={needsRiskConfirmation && !isRiskConfirmed}
    >
      {children}
    </ReviewTransactionContentView>
  )
}

const useSafeTx = () => useContext(SafeTxContext).safeTx
const useSafeTxError = () => useContext(SafeTxContext).safeTxError

export default madProps(ReviewTransactionContent, {
  safeTx: useSafeTx,
  safeTxError: useSafeTxError,
  safeShield: useSafeShield,
})
