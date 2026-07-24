import React, { useCallback, useMemo, type ReactNode } from 'react'
import useTxStepper from './useTxStepper'
import SafeTxProvider from './SafeTxProvider'
import { TxInfoProvider } from './TxInfoProvider'
import TxFlowProvider, { type TxFlowProviderProps, type TxFlowContextType } from './TxFlowProvider'
import { TxFlowContent } from './common/TxFlowContent'
import ReviewTransaction from '../tx/ReviewTransactionV2'
import { ConfirmTxReceipt } from '../tx/ConfirmTxReceipt'
import { TxNote, SignerSelect, BalanceChanges, FeeInfoBanner, FeesPreview, RiskConfirmation } from './features'
import { SlotProvider } from './slots'
import { useTrackTimeSpent } from '@/components/tx/shared/tracking'
import { useLoadFeature } from '@/features/__core__'
import { LedgerFeature } from '@/features/ledger'
import { SafeShieldProvider } from '@/features/safe-shield/SafeShieldContext'

type SubmitCallbackProps = { txId?: string; isExecuted?: boolean }
export type SubmitCallback = (args?: SubmitCallbackProps) => void
export type SubmitCallbackWithData<T> = (args: SubmitCallbackProps & { data?: T }) => void

type TxFlowProps<T extends unknown> = {
  children?: ReactNode[] | ReactNode
  initialData?: T
  onSubmit?: SubmitCallbackWithData<T>
  txId?: TxFlowProviderProps<T>['txId']
  txNonce?: TxFlowProviderProps<T>['txNonce']
  onlyExecute?: TxFlowProviderProps<T>['onlyExecute']
  isExecutable?: TxFlowProviderProps<T>['isExecutable']
  isRejection?: TxFlowProviderProps<T>['isRejection']
  isBatch?: TxFlowProviderProps<T>['isBatch']
  isBatchable?: TxFlowProviderProps<T>['isBatchable']
  ReviewTransactionComponent?: typeof ReviewTransaction
  eventCategory?: string
  /**
   * When set, TxFlow does not append the default Review + Confirm steps. Flows that render their
   * own single merged screen (e.g. the one-screen Token Transfer) opt in; every other flow keeps
   * the default multi-step behaviour.
   */
  hideDefaultSteps?: boolean
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
  txNonce,
  onSubmit,
  onlyExecute,
  isExecutable,
  isRejection,
  isBatch,
  isBatchable,
  ReviewTransactionComponent = ReviewTransaction,
  eventCategory,
  hideDefaultSteps = false,
  ...txLayoutProps
}: TxFlowProps<T>) => {
  const { LedgerHashComparison } = useLoadFeature(LedgerFeature)
  const { step, data, nextStep, prevStep } = useTxStepper(initialData, eventCategory)

  const trackTimeSpent = useTrackTimeSpent()

  const handleFlowSubmit = useCallback<SubmitCallback>(
    (props) => {
      onSubmit?.({ ...props, data })
      trackTimeSpent()
    },
    [onSubmit, data, trackTimeSpent],
  )

  const childrenArray = Array.isArray(children) ? children : [children]

  const steps = useMemo(
    () =>
      hideDefaultSteps
        ? childrenArray
        : [
            ...childrenArray,
            <ReviewTransactionComponent key="tx-flow-review" onSubmit={() => nextStep()}>
              <BalanceChanges />
              <FeesPreview />
              <FeeInfoBanner />
              <TxNote />
              <SignerSelect />
              <RiskConfirmation />
            </ReviewTransactionComponent>,
            <ConfirmTxReceipt key="tx-flow-confirm" onSubmit={handleFlowSubmit} />,
          ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hideDefaultSteps, childrenArray.length, ReviewTransactionComponent, nextStep, handleFlowSubmit],
  )

  const progress = useMemo(() => Math.round(((step + 1) / steps.length) * 100), [step, steps.length])

  return (
    <SafeTxProvider>
      <TxInfoProvider>
        <SafeShieldProvider>
          <SlotProvider>
            <TxFlowProvider
              step={step}
              data={data}
              nextStep={nextStep}
              prevStep={prevStep}
              onFlowSubmit={handleFlowSubmit}
              progress={progress}
              txId={txId}
              txNonce={txNonce}
              txLayoutProps={txLayoutProps}
              onlyExecute={onlyExecute}
              isExecutable={isExecutable}
              isRejection={isRejection}
              isBatch={isBatch}
              isBatchable={isBatchable}
            >
              <TxFlowContent>{...steps}</TxFlowContent>
              <LedgerHashComparison />
            </TxFlowProvider>
          </SlotProvider>
        </SafeShieldProvider>
      </TxInfoProvider>
    </SafeTxProvider>
  )
}
