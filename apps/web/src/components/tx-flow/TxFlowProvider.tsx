/**
 * TxFlowProvider - Central state management for transaction flows
 *
 * This provider manages:
 * - Flow navigation (step, progress, onPrev, onNext)
 * - Transaction state (isCreation, canExecute, willExecute, etc.)
 * - Form state (isSubmitLoading, submitError, isRejectedByUser)
 * - Role execution state (canExecuteThroughRole, willExecuteThroughRole)
 */
import type { TransactionDetails, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode, ReactElement, SetStateAction, Dispatch, ComponentType } from 'react'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsWalletProposer } from '@/hooks/useProposers'
import { useImmediatelyExecutable, useValidateNonce } from '@/components/tx/shared/hooks'
import { useAppSelector } from '@/store'
import { selectSettings } from '@/store/settingsSlice'
import {
  findAllowingRole,
  findMostLikelyRole,
  type Role,
  useRoles,
} from '@/components/tx-flow/actions/ExecuteThroughRole/ExecuteThroughRoleForm/hooks'
import { SafeTxContext } from '../tx-flow/SafeTxProvider'
import { useLazyTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { trackTxEvents } from '@/components/tx/shared/tracking'
import { useSigner } from '@/hooks/wallets/useWallet'
import useChainId from '@/hooks/useChainId'
import { useIsCounterfactualSafe } from '@/features/counterfactual'
import useTxDetails from '@/hooks/useTxDetails'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'

export type TxFlowContextType<T extends unknown = any> = {
  step: number
  progress: number
  data?: T
  onPrev: () => void
  onNext: (data?: T) => void

  txLayoutProps: {
    title?: ReactNode
    subtitle?: ReactNode
    icon?: ComponentType
    txSummary?: Transaction
    hideNonce?: boolean
    fixedNonce?: boolean
    hideProgress?: boolean
    isReplacement?: boolean
    isMessage?: boolean
  }
  updateTxLayoutProps: (props: TxFlowContextType['txLayoutProps']) => void
  trackTxEvent: (txId: string, isExecuted?: boolean, isRoleExecution?: boolean, isProposerCreation?: boolean) => void

  txId?: string
  txNonce?: number
  isCreation: boolean
  isRejection: boolean
  onlyExecute: boolean
  isProposing: boolean
  willExecute: boolean
  isExecutable: boolean
  canExecute: boolean
  shouldExecute: boolean
  setShouldExecute: Dispatch<SetStateAction<boolean>>

  isSubmitLoading: boolean
  setIsSubmitLoading: Dispatch<SetStateAction<boolean>>

  isSubmitDisabled: boolean
  setIsSubmitDisabled: Dispatch<SetStateAction<boolean>>

  submitError?: Error
  setSubmitError: Dispatch<SetStateAction<Error | undefined>>
  isRejectedByUser: boolean
  setIsRejectedByUser: Dispatch<SetStateAction<boolean>>

  willExecuteThroughRole: boolean
  canExecuteThroughRole: boolean
  txDetails?: TransactionDetails
  txDetailsLoading?: boolean
  isBatch: boolean
  isBatchable: boolean
  role?: Role
}

export const initialContext: TxFlowContextType = {
  step: 0,
  progress: 0,
  data: undefined,
  onPrev: () => {},
  onNext: () => {},

  txLayoutProps: {},
  updateTxLayoutProps: () => {},
  trackTxEvent: () => {},

  isCreation: false,
  isRejection: false,
  onlyExecute: false,
  isProposing: false,
  willExecute: false,
  isExecutable: false,
  canExecute: false,
  shouldExecute: false,
  setShouldExecute: () => {},

  isSubmitLoading: false,
  setIsSubmitLoading: () => {},

  isSubmitDisabled: false,
  setIsSubmitDisabled: () => {},

  submitError: undefined,
  setSubmitError: () => {},
  isRejectedByUser: false,
  setIsRejectedByUser: () => {},

  willExecuteThroughRole: false,
  canExecuteThroughRole: false,
  isBatch: false,
  isBatchable: true,
}

export const TxFlowContext = createContext<TxFlowContextType>(initialContext)

export type TxFlowProviderProps<T extends unknown> = {
  children: ReactNode
  step: number
  data: T
  prevStep: () => void
  nextStep: (data: T) => void
  progress?: number
  txId?: string
  txNonce?: TxFlowContextType['txNonce']
  isExecutable?: boolean
  onlyExecute?: TxFlowContextType['onlyExecute']
  isRejection?: TxFlowContextType['isRejection']
  txLayoutProps?: TxFlowContextType['txLayoutProps']
  isBatch?: TxFlowContextType['isBatch']
  isBatchable?: TxFlowContextType['isBatchable']
}

const TxFlowProvider = <T extends unknown>({
  children,
  step,
  data,
  nextStep,
  prevStep,
  progress = 0,
  txId,
  txNonce,
  isExecutable = false,
  onlyExecute = initialContext.onlyExecute,
  txLayoutProps: defaultTxLayoutProps = initialContext.txLayoutProps,
  isRejection = initialContext.isRejection,
  isBatch = initialContext.isBatch,
  isBatchable = initialContext.isBatchable,
}: TxFlowProviderProps<T>): ReactElement => {
  const signer = useSigner()
  const isSafeOwner = useIsSafeOwner()
  const { safe } = useSafeInfo()
  const isProposer = useIsWalletProposer()
  const chainId = useChainId()
  const { safeTx, txOrigin } = useContext(SafeTxContext)
  const isCorrectNonce = useValidateNonce(safeTx)
  const { transactionExecution } = useAppSelector(selectSettings)
  const [shouldExecute, setShouldExecute] = useState<boolean>(transactionExecution)
  const [isSubmitLoading, setIsSubmitLoading] = useState<boolean>(initialContext.isSubmitLoading)
  const [isSubmitDisabled, setIsSubmitDisabled] = useState<boolean>(initialContext.isSubmitDisabled)
  const [submitError, setSubmitError] = useState<Error | undefined>(initialContext.submitError)
  const [isRejectedByUser, setIsRejectedByUser] = useState<boolean>(initialContext.isRejectedByUser)
  const [txLayoutProps, setTxLayoutProps] = useState<TxFlowContextType['txLayoutProps']>(defaultTxLayoutProps)
  const [trigger] = useLazyTransactionsGetTransactionByIdV1Query()
  const isCounterfactualSafe = useIsCounterfactualSafe()
  const [txDetails, , txDetailsLoading] = useTxDetails(txId)
  const { needsRiskConfirmation, isRiskConfirmed } = useSafeShield()
  const isUntrustedSafeBlocked = needsRiskConfirmation && !isRiskConfirmed

  const isCreation = !txId
  const isNewExecutableTx = useImmediatelyExecutable() && isCreation

  const isProposing = !!isProposer && !isSafeOwner && isCreation

  // Check if a Zodiac Roles mod is enabled and if the user is a member of any role that allows the transaction
  const roles = useRoles(
    !isCounterfactualSafe && isCreation && !(isNewExecutableTx && isSafeOwner) ? safeTx : undefined,
  )
  const allowingRole = findAllowingRole(roles)
  const mostLikelyRole = findMostLikelyRole(roles)
  const canExecuteThroughRole = !!allowingRole || (!!mostLikelyRole && !isSafeOwner)
  const preferThroughRole = canExecuteThroughRole && !isSafeOwner // execute through role if a non-owner role member wallet is connected

  // If checkbox is checked and the transaction is executable, execute it, otherwise sign it
  const canExecute = isCorrectNonce && (isExecutable || isNewExecutableTx)
  const willExecute = (onlyExecute || shouldExecute) && canExecute && !preferThroughRole
  const willExecuteThroughRole =
    (onlyExecute || shouldExecute) && canExecuteThroughRole && (!canExecute || preferThroughRole)

  const updateTxLayoutProps = useCallback((props: TxFlowContextType['txLayoutProps']) => {
    setTxLayoutProps({ ...defaultTxLayoutProps, ...props })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const trackTxEvent = useCallback(
    async (txId: string, isExecuted = false, isRoleExecution = false, isProposerCreation = false) => {
      const { data: details } = await trigger({ chainId, id: txId })
      // Compute isMassPayout from data (recipients.length > 1)
      const isMassPayout = (data as any)?.recipients?.length > 1
      // Track tx event
      trackTxEvents(
        details,
        !!isCreation,
        isExecuted,
        isRoleExecution,
        isProposerCreation,
        !!signer?.isSafe,
        txOrigin,
        isMassPayout,
        safe.threshold,
      )
    },
    [chainId, isCreation, trigger, signer?.isSafe, txOrigin, data, safe.threshold],
  )

  const value = {
    step,
    progress,
    data,
    onPrev: prevStep,
    onNext: nextStep,

    txLayoutProps,
    updateTxLayoutProps,
    trackTxEvent,

    txId,
    txNonce,
    isCreation,
    isRejection,
    onlyExecute,
    isProposing,
    isExecutable,
    canExecute,
    willExecute,
    shouldExecute,
    setShouldExecute,

    isSubmitLoading,
    setIsSubmitLoading,

    isSubmitDisabled: isSubmitDisabled || isSubmitLoading || isUntrustedSafeBlocked,
    setIsSubmitDisabled,

    submitError,
    setSubmitError,
    isRejectedByUser,
    setIsRejectedByUser,

    willExecuteThroughRole,
    canExecuteThroughRole,
    role: allowingRole || mostLikelyRole,
    txDetails,
    txDetailsLoading,
    isBatch,
    isBatchable,
  }

  return <TxFlowContext.Provider value={value}>{children}</TxFlowContext.Provider>
}

export default TxFlowProvider
