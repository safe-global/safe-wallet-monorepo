import React, { useMemo, type ReactNode } from 'react'
import useTxStepper from './useTxStepper'
import SafeTxProvider from './SafeTxProvider'
import { TxInfoProvider } from './TxInfoProvider'
import { TxSecurityProvider } from '../tx/security/shared/TxSecurityContext'
import TxFlowProvider, { type TxFlowContextType } from './TxFlowProvider'
import { TxFlowContent } from './common/TxFlowContent'
import { withMiddlewares } from './withMiddlewares'
import ReviewTransaction from '../tx/ReviewTransactionV2'
import { ConfirmTxReceipt } from '../tx/ConfirmTxReceipt'
import { TxChecks, TxNote } from './features'
import { Batching, Counterfactual, Execute, ExecuteThroughRole, Propose, Sign } from './actions'

export type SubmitCallbackProps = { txId?: string; isExecuted?: boolean }
export type SubmitCallbackPropsWithData<T extends unknown> = SubmitCallbackProps & { data?: T }

export type NextStepCallback<T> = (args?: T) => void
export type SubmitCallback = (args: SubmitCallbackProps) => void
export type SubmitCallbackWithData<T> = (args: SubmitCallbackPropsWithData<T>) => void

type TxFlowProps<T extends unknown> = {
  children?: ReactNode[] | ReactNode
  initialData?: T
  txId?: string
  onSubmit?: SubmitCallbackWithData<T>
  onlyExecute?: boolean
  isExecutable?: boolean
  showMethodCall?: boolean
  isRejection?: boolean
  ReviewTransactionComponent?: typeof ReviewTransaction
  eventCategory?: string
} & TxFlowContextType['txLayoutProps']

export const TxFlow = <T extends unknown>({
  children = [],
  initialData,
  txId,
  onSubmit,
  onlyExecute,
  isExecutable,
  showMethodCall,
  isRejection,
  ReviewTransactionComponent = ReviewTransaction,
  eventCategory,
  ...txLayoutProps
}: TxFlowProps<T>) => {
  const { step, data, nextStep, prevStep } = useTxStepper(initialData, eventCategory)

  const childrenArray = Array.isArray(children) ? children : [children]

  const progress = useMemo(
    () => Math.round(((step + 1) / (childrenArray.length + 2)) * 100),
    [step, childrenArray.length],
  )

  const ReviewTransactionStep = withMiddlewares<T>(ReviewTransactionComponent, [TxChecks, TxNote], [Batching])

  const ConfirmTxReceiptStep = withMiddlewares<T, SubmitCallback>(ConfirmTxReceipt, undefined, [
    Counterfactual,
    Execute,
    ExecuteThroughRole,
    Sign,
    Propose,
  ])

  return (
    <SafeTxProvider>
      <TxInfoProvider>
        <TxSecurityProvider>
          <TxFlowProvider
            step={step}
            data={data}
            nextStep={nextStep}
            prevStep={prevStep}
            progress={progress}
            txId={txId}
            txLayoutProps={txLayoutProps}
            onlyExecute={onlyExecute}
            isExecutable={isExecutable}
            showMethodCall={showMethodCall}
            isRejection={isRejection}
          >
            <TxFlowContent>
              {...childrenArray}

              <ReviewTransactionStep onSubmit={nextStep} />

              <ConfirmTxReceiptStep onSubmit={(props = {}) => onSubmit?.({ ...props, data })} />
            </TxFlowContent>
          </TxFlowProvider>
        </TxSecurityProvider>
      </TxInfoProvider>
    </SafeTxProvider>
  )
}
