import type { PropsWithChildren, SyntheticEvent, ReactElement, ReactNode } from 'react'
import { useContext, useCallback } from 'react'
import madProps from '@/utils/mad-props'
import ExecuteCheckbox from '../ExecuteCheckbox'
import { useImmediatelyExecutable } from '../SignOrExecuteForm/hooks'
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
import { SignerForm } from '../SignOrExecuteForm/SignerForm'
import UnknownContractError from '../SignOrExecuteForm/UnknownContractError'
import { Button, CardActions, CircularProgress, Stack } from '@mui/material'
import CheckWallet from '@/components/common/CheckWallet'
import { TxFlowContext } from '@/components/tx-flow-2/TxFlowProvider'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'

export type ReviewTransactionContentProps = PropsWithChildren<{
  onSubmit?: () => void
  isBatch?: boolean
  actions?: ReactNode
  features?: ReactNode
}>

export const ReviewTransactionContent = ({
  safeTx,
  safeTxError,
  onSubmit,
  isBatch,
  actions,
  features,
  isOwner,
  children,
  txId,
  txDetails,
  txPreview,
}: ReviewTransactionContentProps & {
  isOwner: ReturnType<typeof useIsSafeOwner>
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
  } = useContext(TxFlowContext)

  const isNewExecutableTx = useImmediatelyExecutable() && isCreation
  const [readableApprovals] = useApprovalInfos({ safeTransaction: safeTx })
  const isApproval = readableApprovals && readableApprovals.length > 0
  const isCounterfactualSafe = useIsCounterfactualSafe()

  // Check if a Zodiac Roles mod is enabled and if the user is a member of any role that allows the transaction
  const roles = useRoles(!isCounterfactualSafe && isCreation && !(isNewExecutableTx && isOwner) ? safeTx : undefined)
  const allowingRole = findAllowingRole(roles)
  const mostLikelyRole = findMostLikelyRole(roles)
  const canExecuteThroughRole = !!allowingRole || (!!mostLikelyRole && !isOwner)

  const onContinueClick = useCallback(
    async (e: SyntheticEvent) => {
      e.preventDefault()
      onSubmit?.()
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

      {features}

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

export default madProps(ReviewTransactionContent, {
  isOwner: useIsSafeOwner,
  safeTx: useSafeTx,
  safeTxError: useSafeTxError,
})
