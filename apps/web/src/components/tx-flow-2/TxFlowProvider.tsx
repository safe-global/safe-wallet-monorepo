import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode, ReactElement, SetStateAction, Dispatch } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
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
} from '@/components/tx/SignOrExecuteForm/ExecuteThroughRoleForm/hooks'
import { SafeTxContext } from '../tx-flow/SafeTxProvider'
import type { TxLayoutProps } from './common/TxLayout'
import { useLazyGetTransactionDetailsQuery } from '@/store/slices'
import { trackTxEvents } from '../tx/SignOrExecuteForm/tracking'
import { useSigner } from '@/hooks/wallets/useWallet'
import useChainId from '@/hooks/useChainId'

export type TxFlowContextType = {
  step: number
  progress: number
  data: any
  onPrev: () => void
  onNext: (data: any) => void

  txLayoutProps: Partial<Omit<TxLayoutProps, 'children' | 'progress' | 'onBack' | 'step'>>
  updateTxLayoutProps: (props: TxFlowContextType['txLayoutProps']) => void
  trackTxEvent: (txId: string, isExecuted?: boolean, isRoleExecution?: boolean, isProposerCreation?: boolean) => void

  txId?: string
  isCreation: boolean
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
  showMethodCall?: boolean
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
}

export const TxFlowContext = createContext<TxFlowContextType>(initialContext)

type TxFlowProviderProps<T extends unknown> = {
  children: ReactNode
  step: number
  data: T
  prevStep: () => void
  nextStep: (data: T) => void
  progress?: number
  txId?: string
  isExecutable?: boolean
  onlyExecute?: TxFlowContextType['onlyExecute']
  txLayoutProps?: TxFlowContextType['txLayoutProps']
  showMethodCall?: TxFlowContextType['showMethodCall']
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
  showMethodCall,
}: TxFlowProviderProps<T>): ReactElement => {
  const { safe } = useSafeInfo()
  const signer = useSigner()
  const isSafeOwner = useIsSafeOwner()
  const isProposer = useIsWalletProposer()
  const chainId = useChainId()
  const { safeTx, txOrigin } = useContext(SafeTxContext)
  const isCorrectNonce = useValidateNonce(safeTx)
  const { transactionExecution } = useAppSelector(selectSettings)
  const [shouldExecute, setShouldExecute] = useState<boolean>(transactionExecution)
  const [isSubmittable, setIsSubmittable] = useState<boolean>(true)
  const [txLayoutProps, setTxLayoutProps] = useState<TxFlowContextType['txLayoutProps']>(defaultTxLayoutProps)
  const [trigger] = useLazyGetTransactionDetailsQuery()

  const isCreation = !txId
  const isNewExecutableTx = useImmediatelyExecutable() && isCreation

  const isProposing = !!isProposer && !isSafeOwner && isCreation
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
  const canExecute = isCorrectNonce && (isExecutable || isNewExecutableTx)
  const willExecute = (onlyExecute || shouldExecute) && canExecute && !preferThroughRole
  const willExecuteThroughRole =
    (onlyExecute || shouldExecute) && canExecuteThroughRole && (!canExecute || preferThroughRole)

  const updateTxLayoutProps = useCallback((props: TxFlowContextType['txLayoutProps']) => {
    setTxLayoutProps({ ...defaultTxLayoutProps, ...props })
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
        // isMassPayout, // TODO: Add this parameter
      )
    },
    [chainId, isCreation, trigger, signer?.isSafe, txOrigin],
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
    role: allowingRole || mostLikelyRole,
    showMethodCall,
  }

  return <TxFlowContext.Provider value={value}>{children}</TxFlowContext.Provider>
}

export default TxFlowProvider
