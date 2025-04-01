import React, { type ComponentType, type PropsWithChildren, useMemo, type ReactNode } from 'react'
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

type ComponentWithChildren<T> = ComponentType<PropsWithChildren<T>>

export type SubmitCallbackProps = { txId?: string; isExecuted?: boolean }
export type SubmitCallbackPropsWithData<T extends unknown> = SubmitCallbackProps & { data?: T }

export type NextStepCallback<T> = (args?: T) => void
export type SubmitCallback = (args: SubmitCallbackProps) => void
export type SubmitCallbackWithData<T> = (args: SubmitCallbackPropsWithData<T>) => void

type CommonTxFlowSteps<T extends unknown> =
  | [...ComponentWithChildren<{ onSubmit: NextStepCallback<T> }>[], ComponentWithChildren<{ onSubmit: SubmitCallback }>]
  | []

/**
 * Creates a transaction flow component with the provided common steps.
 * @param commonSteps - Common steps to be used in the end of the transaction flow
 * @returns a transaction flow component
 * @example
 * const MyTxFlow = createTxFlow([Step4, Step5])
 * <MyTxFlow>
 *   <Step1 />
 *   <Step2 />
 *   <Step3 />
 * </MyTxFlow>
 * // This will render Step1, Step2, Step3, Step4 and Step5 in order
 * // The last step will be Step3, which will have the onSubmit prop passed to it
 */
export const createTxFlow = <T extends unknown>(commonSteps: CommonTxFlowSteps<T> = []) => {
  const extraSteps = commonSteps.slice(0, -1) as ComponentWithChildren<{ onSubmit: NextStepCallback<T> }>[]
  const [LastStep] = commonSteps.slice(-1) as [ComponentWithChildren<{ onSubmit: SubmitCallback }>] | []

  const TxFlow = ({
    children = [],
    initialData,
    txId,
    onSubmit,
    onlyExecute,
    isExecutable,
    showMethodCall,
    isRejection,
    ...txLayoutProps
  }: {
    children?: ReactNode[] | ReactNode
    initialData?: T
    txId?: string
    onSubmit?: SubmitCallbackWithData<T>
    onlyExecute?: boolean
    isExecutable?: boolean
    showMethodCall?: boolean
    isRejection?: boolean
  } & TxFlowContextType['txLayoutProps']) => {
    const { step, data, nextStep, prevStep } = useTxStepper(initialData, 'test') // TODO: replace 'test' string

    const childrenArray = Array.isArray(children) ? children : [children]

    const progress = useMemo(
      () => Math.round(((step + 1) / (commonSteps.length + childrenArray.length)) * 100),
      [step, childrenArray.length],
    )

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

                {extraSteps.map((Component, i) => (
                  <Component onSubmit={nextStep} key={`common-step-${i}`} />
                ))}

                {LastStep && (
                  <LastStep
                    onSubmit={(props = {}) => onSubmit?.({ ...props, data })}
                    key={`common-step-${extraSteps.length}`}
                  />
                )}
              </TxFlowContent>
            </TxFlowProvider>
          </TxSecurityProvider>
        </TxInfoProvider>
      </SafeTxProvider>
    )
  }

  return TxFlow
}

/**
 * Creates a transaction flow component with the default steps, features and actions.
 * @param ReviewTransactionComponent optional component to replace the default ReviewTransaction component
 * @param TxReceiptComponent optional component to replace the default TxReceipt component
 * @returns a transaction flow component with the default steps
 * @example
 * const MyTxFlow = createDefaultTxFlow()
 * <MyTxFlow>
 *   <Step1 />
 *   <Step2 />
 * </MyTxFlow>
 * // This will render Step1, Step2, ReviewTransaction and TxReceipt in order
 * // The last step will be TxReceipt, which will have the onSubmit prop passed to it
 */
export const createDefaultTxFlow = <T extends unknown>(
  ReviewTransactionComponent: ComponentWithChildren<{
    onSubmit?: NextStepCallback<T>
    actions?: ReactNode
    features?: ReactNode
  }> = ReviewTransaction,
  TxReceiptComponent: ComponentWithChildren<{
    onSubmit?: SubmitCallback
    actions?: ReactNode
    features?: ReactNode
  }> = ConfirmTxReceipt,
) =>
  createTxFlow<T>([
    withMiddlewares<T>(ReviewTransactionComponent, [TxChecks, TxNote], [Batching]),
    withMiddlewares<T, SubmitCallback>(TxReceiptComponent, undefined, [
      Counterfactual,
      Execute,
      ExecuteThroughRole,
      Sign,
      Propose,
    ]),
  ])
