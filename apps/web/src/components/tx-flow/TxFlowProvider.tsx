import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode, ReactElement, SetStateAction, Dispatch, ComponentType } from 'react'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsWalletProposer } from '@/hooks/useProposers'
import { useImmediatelyExecutable, useValidateNonce } from '@/components/tx/SignOrExecuteForm/hooks'
import { useAppSelector } from '@/store'
import { selectSettings } from '@/store/settingsSlice'
import {
  findAllowingRole,
  findMostLikelyRole,
  type Role,
  useRoles,
} from '@/components/tx-flow/actions/ExecuteThroughRole/ExecuteThroughRoleForm/hooks'
import { SafeTxContext } from '../tx-flow/SafeTxProvider'
import { useLazyGetTransactionDetailsQuery } from '@/store/slices'
import { trackTxEvents } from '../tx/SignOrExecuteForm/tracking'
import { useSigner } from '@/hooks/wallets/useWallet'
import useChainId from '@/hooks/useChainId'
import useIsCounterfactualSafe from '@/features/counterfactual/hooks/useIsCounterfactualSafe'
import useTxDetails from '@/hooks/useTxDetails'
import type { TransactionDetails, TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'

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
    txSummary?: TransactionSummary
    hideNonce?: boolean
    fixedNonce?: boolean
    hideProgress?: boolean
    isReplacement?: boolean
    isMessage?: boolean
  }
  updateTxLayoutProps: (props: TxFlowContextType['txLayoutProps']) => void
  trackTxEvent: (txId: string, isExecuted?: boolean, isRoleExecution?: boolean, isProposerCreation?: boolean) => void

  txId?: string
  isCreation: boolean
  isRejection: boolean
  onlyExecute: boolean
  isProposing: boolean
  willExecute: boolean
  isExecutable: boolean
  canExecute: boolean
  shouldExecute: boolean
  setShouldExecute: Dispatch<SetStateAction<boolean>>
  isSubmittable: boolean
  setIsSubmittable: Dispatch<SetStateAction<boolean>>
  willExecuteThroughRole: boolean
  canExecuteThroughRole: boolean
  txDetails?: TransactionDetails
  txDetailsLoading?: boolean
  showMethodCall?: boolean
  isBatch: boolean
  role?: Role
}

const initialContext: TxFlowContextType = {
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
  isSubmittable: true,
  setIsSubmittable: () => {},
  willExecuteThroughRole: false,
  canExecuteThroughRole: false,
  isBatch: false,
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
  isExecutable?: boolean
  onlyExecute?: TxFlowContextType['onlyExecute']
  isRejection?: TxFlowContextType['isRejection']
  txLayoutProps?: TxFlowContextType['txLayoutProps']
  showMethodCall?: TxFlowContextType['showMethodCall']
  isBatch?: TxFlowContextType['isBatch']
}

const TxFlowProvider = <T extends unknown>({
  children,
  step,
  data,
  nextStep,
  prevStep,
  progress = 0,
  txId,
  isExecutable = false,
  onlyExecute = initialContext.onlyExecute,
  txLayoutProps: defaultTxLayoutProps = initialContext.txLayoutProps,
  isRejection = initialContext.isRejection,
  isBatch = initialContext.isBatch,
  showMethodCall,
}: TxFlowProviderProps<T>): ReactElement => {
  const signer = useSigner()
  const isSafeOwner = useIsSafeOwner()
  const isProposer = useIsWalletProposer()
  const chainId = useChainId()
  const { safeTx, txOrigin, isMassPayout } = useContext(SafeTxContext)
  const isCorrectNonce = useValidateNonce(safeTx)
  const { transactionExecution } = useAppSelector(selectSettings)
  const [shouldExecute, setShouldExecute] = useState<boolean>(transactionExecution)
  const [isSubmittable, setIsSubmittable] = useState<boolean>(true)
  const [txLayoutProps, setTxLayoutProps] = useState<TxFlowContextType['txLayoutProps']>(defaultTxLayoutProps)
  const [trigger] = useLazyGetTransactionDetailsQuery()
  const isCounterfactualSafe = useIsCounterfactualSafe()
  const [txDetails, , txDetailsLoading] = useTxDetails(txId)

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
      const { data: details } = await trigger({ chainId, txId })
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
      )
    },
    [chainId, isCreation, trigger, signer?.isSafe, txOrigin, isMassPayout],
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
    isCreation,
    isRejection,
    onlyExecute,
    isProposing,
    isExecutable,
    canExecute,
    willExecute,
    shouldExecute,
    setShouldExecute,
    isSubmittable,
    setIsSubmittable,
    willExecuteThroughRole,
    canExecuteThroughRole,
    role: allowingRole || mostLikelyRole,
    showMethodCall,
    txDetails,
    txDetailsLoading,
    isBatch,
  }

  return <TxFlowContext.Provider value={value}>{children}</TxFlowContext.Provider>
}

export default TxFlowProvider
