import React, { useMemo, type ReactNode } from 'react'
import useTxStepper from './useTxStepper'
import SafeTxProvider from './SafeTxProvider'
import { TxInfoProvider } from './TxInfoProvider'
import { TxSecurityProvider } from '../tx/security/shared/TxSecurityContext'
import TxFlowProvider, { type TxFlowContextType } from './TxFlowProvider'
import { TxFlowContent } from './common/TxFlowContent'
import ReviewTransaction from '../tx/ReviewTransactionV2'
import { ConfirmTxReceipt } from '../tx/ConfirmTxReceipt'
// import { TxChecks, TxNote } from './features'
import { Batching, Counterfactual, Execute, ExecuteThroughRole, Propose, Sign } from './actions'
import { withActions } from './withActions'

type SubmitCallbackProps = { txId?: string; isExecuted?: boolean }
export type SubmitCallback = (args?: SubmitCallbackProps) => void
export type SubmitCallbackWithData<T> = (args: SubmitCallbackProps & { data?: T }) => void

const ConfirmTxReceiptStep = withActions(ConfirmTxReceipt, [Counterfactual, Execute, ExecuteThroughRole, Propose, Sign])

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

  const ReviewTransactionStep = withActions(ReviewTransactionComponent, [Batching])

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
              <ReviewTransactionStep onSubmit={() => nextStep(data)} />
              <ConfirmTxReceiptStep onSubmit={(props = {}) => onSubmit?.({ ...props, data })} />
            </TxFlowContent>
          </TxFlowProvider>
        </TxSecurityProvider>
      </TxInfoProvider>
    </SafeTxProvider>
  )
}
