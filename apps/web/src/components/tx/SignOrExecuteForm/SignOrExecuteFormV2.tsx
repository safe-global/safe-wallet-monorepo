import ProposerForm from '@/components/tx/SignOrExecuteForm/ProposerForm'
import CounterfactualForm from '@/features/counterfactual/CounterfactualForm'
import { useIsWalletProposer } from '@/hooks/useProposers'
import useSafeInfo from '@/hooks/useSafeInfo'
import { type ReactElement, type ReactNode, useContext, useCallback } from 'react'
import madProps from '@/utils/mad-props'
import { useImmediatelyExecutable, useValidateNonce } from './hooks'
import ExecuteForm from './ExecuteForm'
import SignFormV2 from './SignFormV2'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { useAppSelector } from '@/store'
import { selectSettings } from '@/store/settingsSlice'
import useChainId from '@/hooks/useChainId'
import ExecuteThroughRoleForm from './ExecuteThroughRoleForm'
import { findAllowingRole, findMostLikelyRole, useRoles } from './ExecuteThroughRoleForm/hooks'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useLazyGetTransactionDetailsQuery } from '@/store/api/gateway'
import type { TransactionDetails, TransactionPreview } from '@safe-global/safe-gateway-typescript-sdk'
import { useSigner } from '@/hooks/wallets/useWallet'
import { trackTxEvents } from './tracking'

export type SubmitCallback = (txId: string, isExecuted?: boolean) => void

export type SignOrExecuteProps = {
  txId?: string
  onSubmit?: SubmitCallback
  children?: ReactNode
  isExecutable?: boolean
  isRejection?: boolean
  onlyExecute?: boolean
  disableSubmit?: boolean
  origin?: string
  showMethodCall?: boolean
  tooltip?: string
}

export const SignOrExecuteFormV2 = ({
  chainId,
  safeTx,
  safeTxError,
  onSubmit,
  isCreation,
  origin,
  ...props
}: SignOrExecuteProps & {
  chainId: ReturnType<typeof useChainId>
  safeTx: ReturnType<typeof useSafeTx>
  safeTxError: ReturnType<typeof useSafeTxError>
  isCreation?: boolean
  txDetails?: TransactionDetails
  txPreview?: TransactionPreview
}): ReactElement | undefined => {
  const { transactionExecution: shouldExecute } = useAppSelector(selectSettings)
  const isNewExecutableTx = useImmediatelyExecutable() && isCreation
  const isCorrectNonce = useValidateNonce(safeTx)

  const [trigger] = useLazyGetTransactionDetailsQuery()
  const { safe } = useSafeInfo()
  const isSafeOwner = useIsSafeOwner()
  const signer = useSigner()
  const isProposer = useIsWalletProposer()
  const isProposing = isProposer && !isSafeOwner && !!isCreation
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

  const onFormSubmit = useCallback(
    async (txId: string, isExecuted = false, isRoleExecution = false, isProposerCreation = false) => {
      onSubmit?.(txId, isExecuted)

      const { data: details } = await trigger({ chainId, txId })
      // Track tx event
      trackTxEvents(details, !!isCreation, isExecuted, isRoleExecution, isProposerCreation, !!signer?.isSafe, origin)
    },
    [chainId, isCreation, onSubmit, trigger, signer?.isSafe, origin],
  )

  const onRoleExecutionSubmit = useCallback<typeof onFormSubmit>(
    (txId, isExecuted) => onFormSubmit(txId, isExecuted, true),
    [onFormSubmit],
  )

  const onProposerFormSubmit = useCallback<typeof onFormSubmit>(
    (txId, isExecuted) => onFormSubmit(txId, isExecuted, false, true),
    [onFormSubmit],
  )

  const commonProps = {
    ...props,
    safeTx,
    isCreation,
    origin,
    onSubmit: onFormSubmit,
  }
  if (isCounterfactualSafe && !isProposing) {
    return <CounterfactualForm {...commonProps} onlyExecute />
  }

  if (!isCounterfactualSafe && willExecute && !isProposing) {
    return <ExecuteForm {...commonProps} />
  }

  if (!isCounterfactualSafe && willExecuteThroughRole) {
    return (
      <ExecuteThroughRoleForm
        {...commonProps}
        role={(allowingRole || mostLikelyRole)!}
        safeTxError={safeTxError}
        onSubmit={onRoleExecutionSubmit}
      />
    )
  }

  if (!isCounterfactualSafe && !willExecute && !willExecuteThroughRole && !isProposing) {
    return <SignFormV2 {...commonProps} />
  }

  if (isProposing) {
    return <ProposerForm {...commonProps} onSubmit={onProposerFormSubmit} />
  }
}

const useSafeTx = () => useContext(SafeTxContext).safeTx
const useSafeTxError = () => useContext(SafeTxContext).safeTxError

export default madProps(SignOrExecuteFormV2, {
  chainId: useChainId,
  safeTx: useSafeTx,
  safeTxError: useSafeTxError,
})
