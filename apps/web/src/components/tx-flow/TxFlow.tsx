import React, { useCallback, useMemo, useState, type ReactNode } from 'react'
import useTxStepper from './useTxStepper'
import SafeTxProvider from './SafeTxProvider'
import { TxInfoProvider } from './TxInfoProvider'
import TxFlowProvider, { type TxFlowProviderProps, type TxFlowContextType } from './TxFlowProvider'
import { TxFlowContent } from './common/TxFlowContent'
import ReviewTransaction from '../tx/ReviewTransactionV2'
import { ConfirmTxReceipt } from '../tx/ConfirmTxReceipt'
import { ExecuteTxStep } from '../tx/ExecuteTxStep'
import TxNote from './features/TxNote'
import SignerSelect from './features/SignerSelect'
import BalanceChanges from './features/BalanceChanges'
import FeeInfoBanner from './features/FeeInfoBanner'
import FeesPreview from './features/FeesPreview'
import RiskConfirmation from './features/RiskConfirmation'
import Batching from './actions/Batching'
import ComboSubmit from './actions/ComboSubmit'
import Counterfactual from './actions/Counterfactual'
import Execute from './actions/Execute'
import ExecuteThroughRole from './actions/ExecuteThroughRole'
import Propose from './actions/Propose'
import Sign from './actions/Sign'
import { SlotProvider } from '@safe-global/views/components/tx-flow/slots/SlotProvider'
import { useTrackTimeSpent } from '@/components/tx/shared/tracking'
import { useLoadFeature } from '@/features/__core__/useLoadFeature'
import { LedgerFeature } from '@/features/ledger'
import { SafeShieldProvider } from '@/features/safe-shield/SafeShieldContext'
import type { SubmitCallback, SubmitCallbackProps } from '@safe-global/views/components/tx-flow/types'
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
  const { LedgerHashComparison } = useLoadFeature(LedgerFeature)
  const { step, data, nextStep, prevStep } = useTxStepper(initialData, eventCategory)

  const childrenArray = Array.isArray(children) ? children : [children]
  const [signedTxId, setSignedTxId] = useState<string>()
  // A queued tx the wallet can only execute is already fully signed, so it skips the signing receipt
  const isReadyToExecute = !!txId && !!onlyExecute && !!isExecutable
  const stepCount = childrenArray.length + (signedTxId ? 3 : 2)

  const progress = useMemo(() => Math.round(((step + 1) / stepCount) * 100), [step, stepCount])

  const trackTimeSpent = useTrackTimeSpent()

  const handleFlowSubmit = useCallback<SubmitCallback>(
    (props) => {
      onSubmit?.({ ...props, data })
      trackTimeSpent()
    },
    [onSubmit, data, trackTimeSpent],
  )

  const handleContinueToExecute = useCallback(
    (txId: string) => {
      setSignedTxId(txId)
      nextStep()
    },
    [nextStep],
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
              onContinueToExecute={handleContinueToExecute}
            >
              <TxFlowContent>
                {...childrenArray}

                <ReviewTransactionComponent onSubmit={() => nextStep()}>
                  <BalanceChanges />
                  <FeesPreview />
                  <FeeInfoBanner />
                  <TxNote />
                  <SignerSelect />
                  <RiskConfirmation />
                </ReviewTransactionComponent>

                {isReadyToExecute ? (
                  <ExecuteTxStep />
                ) : (
                  <ConfirmTxReceipt onSubmit={handleFlowSubmit}>
                    <Counterfactual />

                    <ComboSubmit>
                      <Sign />
                      <Execute />
                      <ExecuteThroughRole />
                      <Batching />
                    </ComboSubmit>

                    <Propose />
                  </ConfirmTxReceipt>
                )}

                {signedTxId && <ExecuteTxStep afterSigning />}
              </TxFlowContent>
              <LedgerHashComparison />
            </TxFlowProvider>
          </SlotProvider>
        </SafeShieldProvider>
      </TxInfoProvider>
    </SafeTxProvider>
  )
}
