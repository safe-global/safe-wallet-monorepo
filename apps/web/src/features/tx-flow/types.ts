/**
 * Public types for the tx-flow feature.
 * These types can be imported by consumers.
 */
import type { ReactElement, ReactNode, ComponentType, Dispatch, SetStateAction } from 'react'
import type { TransactionDetails, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { Role } from '@/features/tx-flow/actions/ExecuteThroughRole/ExecuteThroughRoleForm/hooks'

export type SubmitCallbackProps = { txId?: string; isExecuted?: boolean }
export type SubmitCallback = (args?: SubmitCallbackProps) => void
export type SubmitCallbackWithData<T> = (args: SubmitCallbackProps & { data?: T }) => void

/**
 * Context type for the TxModal (the modal that wraps transaction flows)
 */
export type TxModalContextType = {
  txFlow: ReactElement | undefined
  setTxFlow: (txFlow: TxModalContextType['txFlow'], onClose?: () => void, shouldWarn?: boolean) => void
  setFullWidth: (fullWidth: boolean) => void
}

/**
 * Context type for the TxFlow (individual transaction flow state)
 */
export type TxFlowContextType<T = unknown> = {
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
