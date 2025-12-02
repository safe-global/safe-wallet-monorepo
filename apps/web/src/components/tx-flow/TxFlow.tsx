import React, { useCallback, useMemo, useEffect, type ReactNode } from 'react'
import useTxStepper from './useTxStepper'
import SafeTxProvider from './SafeTxProvider'
import { TxInfoProvider } from './TxInfoProvider'
import TxFlowProvider, { type TxFlowProviderProps, type TxFlowContextType } from './TxFlowProvider'
import { TxFlowContent } from './common/TxFlowContent'
import ReviewTransaction from '../tx/ReviewTransactionV2'
import { ConfirmTxReceipt } from '../tx/ConfirmTxReceipt'
import { TxNote, SignerSelect, BalanceChanges, RiskConfirmation } from './features'
import { Batching, ComboSubmit, Counterfactual, Execute, ExecuteThroughRole, Propose, Sign } from './actions'
import { SlotProvider } from './slots'
import { useTrackTimeSpent } from '@/components/tx/shared/tracking'
import LedgerHashComparison from '@/features/ledger'
import { SafeShieldProvider } from '@/features/safe-shield/SafeShieldContext'
import { loadTxFlowState, clearTxFlowState } from './txFlowStorage'

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
  flowType?: string
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
  flowType,
  ...txLayoutProps
}: TxFlowProps<T>) => {
  // Try to restore saved state on mount
  const savedState = useMemo(() => {
    if (!flowType) return null
    const state = loadTxFlowState<T>()
    // Only restore if the flow type matches
    if (state && state.flowType === flowType) {
      return state
    }
    return null
  }, [flowType])

  const restoredData = (savedState?.data as T) ?? initialData
  const restoredStep = savedState?.step ?? 0

  const { step, data, nextStep, prevStep, setStep, setData } = useTxStepper(
    restoredData,
    eventCategory,
    flowType,
    txId,
    txNonce,
  )

  // Initialize with restored step if we have saved state
  useEffect(() => {
    if (savedState && restoredStep > 0) {
      setStep(restoredStep)
      setData(restoredData)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const childrenArray = Array.isArray(children) ? children : [children]

  const progress = useMemo(
    () => Math.round(((step + 1) / (childrenArray.length + 2)) * 100),
    [step, childrenArray.length],
  )

  const trackTimeSpent = useTrackTimeSpent()

  const handleFlowSubmit = useCallback<SubmitCallback>(
    (props) => {
      onSubmit?.({ ...props, data })
      trackTimeSpent()
      // Clear saved state when flow completes
      clearTxFlowState()
    },
    [onSubmit, data, trackTimeSpent],
  )

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
              <TxFlowContent>
                {...childrenArray}

                <ReviewTransactionComponent onSubmit={() => nextStep()}>
                  <BalanceChanges />
                  <TxNote />
                  <SignerSelect />
                  <RiskConfirmation />
                </ReviewTransactionComponent>

                <ConfirmTxReceipt onSubmit={handleFlowSubmit}>
                  <Counterfactual />
                  <ExecuteThroughRole />

                  <ComboSubmit>
                    <Sign />
                    <Execute />
                    <Batching />
                  </ComboSubmit>

                  <Propose />
                </ConfirmTxReceipt>
              </TxFlowContent>
              <LedgerHashComparison />
            </TxFlowProvider>
          </SlotProvider>
        </SafeShieldProvider>
      </TxInfoProvider>
    </SafeTxProvider>
  )
}
