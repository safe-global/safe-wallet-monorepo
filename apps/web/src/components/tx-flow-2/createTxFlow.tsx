import React, { type ComponentType, type PropsWithChildren, useMemo, type ReactNode } from 'react'
import useTxStepper from '../tx-flow/useTxStepper'
import SafeTxProvider from '../tx-flow/SafeTxProvider'
import { TxInfoProvider } from '../tx-flow/TxInfoProvider'
import { TxSecurityProvider } from '../tx/security/shared/TxSecurityContext'
import TxFlowProvider, { type TxFlowContextType } from './TxFlowProvider'
import { TxFlowContent } from './TxFlowContent'
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

type TxFlowProps<T extends unknown> = {
  commonSteps?:
    | [
        ...ComponentWithChildren<{ onSubmit: NextStepCallback<T> }>[],
        ComponentWithChildren<{ onSubmit: SubmitCallback }>,
      ]
    | []
}

export const createTxFlow = <T extends unknown>({ commonSteps = [] }: TxFlowProps<T>) => {
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

export const createDefaultTxFlow = <T extends unknown>(
  ReviewTransactionComponent: ComponentWithChildren<{ onSubmit?: NextStepCallback<T> }> = ReviewTransaction,
  TxReceiptComponent: ComponentWithChildren<{ onSubmit?: SubmitCallback }> = ConfirmTxReceipt,
) =>
  createTxFlow<T>({
    commonSteps: [
      withMiddlewares<T>(ReviewTransactionComponent, [TxChecks, TxNote], [Batching]),
      withMiddlewares<T, SubmitCallback>(TxReceiptComponent, undefined, [
        Counterfactual,
        Execute,
        ExecuteThroughRole,
        Sign,
        Propose,
      ]),
    ],
  })
