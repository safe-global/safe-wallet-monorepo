import React, { useCallback, useMemo, type ReactNode } from 'react'
import useTxStepper from './useTxStepper'
import SafeTxProvider from './SafeTxProvider'
import { TxInfoProvider } from './TxInfoProvider'
import { TxSecurityProvider } from '../tx/security/shared/TxSecurityContext'
import TxFlowProvider, { type TxFlowContextType } from './TxFlowProvider'
import { TxFlowContent } from './common/TxFlowContent'
import ReviewTransaction from '../tx/ReviewTransactionV2'
import { ConfirmTxReceipt } from '../tx/ConfirmTxReceipt'
import { TxChecks, TxNote, SignerSelect } from './features'
import { Batching, ComboSubmit, Counterfactual, Execute, ExecuteThroughRole, Propose, Sign } from './actions'
import { SlotProvider } from './slots'

type SubmitCallbackProps = { txId?: string; isExecuted?: boolean }
export type SubmitCallback = (args?: SubmitCallbackProps) => void
export type SubmitCallbackWithData<T> = (args: SubmitCallbackProps & { data?: T }) => void

type TxFlowProps<T extends unknown> = {
  children?: ReactNode[] | ReactNode
  initialData?: T
  txId?: string
  onSubmit?: SubmitCallbackWithData<T>
  onlyExecute?: boolean
  isExecutable?: boolean
  isRejection?: boolean
  ReviewTransactionComponent?: typeof ReviewTransaction
  eventCategory?: string
} & TxFlowContextType['txLayoutProps']

/**
 * TxFlow component is a wrapper for the transaction flow, providing context and state management.
 * It uses various providers to manage the transaction state and security context.
 * The component also handles the transaction steps and progress.
 * It accepts children components to be rendered within the flow.
 */
export const TxFlow = <T extends unknown>({
  children = [],
  initialData,
  txId,
  onSubmit,
  onlyExecute,
  isExecutable,
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

  const handleFlowSubmit = useCallback<SubmitCallback>(
    (props) => {
      onSubmit?.({ ...props, data })
    },
    [onSubmit, data],
  )

  const submit = (
    <>
      <Counterfactual />
      <ExecuteThroughRole />

      <ComboSubmit>
        <Sign />
        <Execute />
        <Batching />
      </ComboSubmit>

      <Propose />
    </>
  )

  return (
    <SafeTxProvider>
      <TxInfoProvider>
        <TxSecurityProvider>
          <SlotProvider>
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
              isRejection={isRejection}
            >
              <TxFlowContent>
                {...childrenArray}

                <ReviewTransactionComponent onSubmit={handleFlowSubmit}>
                  <TxChecks />
                  <TxNote />
                  <SignerSelect />

                  {submit}
                </ReviewTransactionComponent>

                <ConfirmTxReceipt onSubmit={handleFlowSubmit}>{submit}</ConfirmTxReceipt>
              </TxFlowContent>
            </TxFlowProvider>
          </SlotProvider>
        </TxSecurityProvider>
      </TxInfoProvider>
    </SafeTxProvider>
  )
}
