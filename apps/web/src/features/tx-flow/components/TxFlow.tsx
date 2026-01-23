import React, { useCallback, useMemo, type ReactNode } from 'react'
import useTxStepper from '@/features/tx-flow/hooks/useTxStepper'
import SafeTxProvider from '@/features/tx-flow/contexts/SafeTxProvider'
import { TxInfoProvider } from '@/features/tx-flow/contexts/TxInfoProvider'
import TxFlowProvider, {
  type TxFlowProviderProps,
  type TxFlowContextType,
} from '@/features/tx-flow/contexts/TxFlowProvider'
import { TxFlowContent } from './common/TxFlowContent'
import ReviewTransaction from '@/components/tx/ReviewTransactionV2'
import { ConfirmTxReceipt } from '@/components/tx/ConfirmTxReceipt'
import { TxNote, SignerSelect, BalanceChanges, RiskConfirmation } from '@/features/tx-flow/features'
import {
  Batching,
  ComboSubmit,
  Counterfactual,
  Execute,
  ExecuteThroughRole,
  Propose,
  Sign,
} from '@/features/tx-flow/actions'
import { SlotProvider } from '@/features/tx-flow/contexts/slots'
import { useTrackTimeSpent } from '@/components/tx/shared/tracking'
import LedgerHashComparison from '@/features/ledger'
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
  ...txLayoutProps
}: TxFlowProps<T>) => {
  const { step, data, nextStep, prevStep } = useTxStepper(initialData, eventCategory)

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
