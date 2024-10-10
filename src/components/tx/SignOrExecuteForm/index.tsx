import useSafeInfo from '@/hooks/useSafeInfo'
import { type ReactElement, type ReactNode, useState, useContext, useCallback } from 'react'
import madProps from '@/utils/mad-props'
import DecodedTx from '../DecodedTx'
import { WrongChainWarning } from '../WrongChainWarning'
import { useImmediatelyExecutable, useValidateNonce } from './hooks'
import ExecuteForm from './ExecuteForm'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import ErrorMessage from '../ErrorMessage'
import TxChecks from './TxChecks'
import TxCard from '@/components/tx-flow/common/TxCard'
import ConfirmationTitle, { ConfirmationTitleTypes } from '@/components/tx/SignOrExecuteForm/ConfirmationTitle'
import { useAppSelector } from '@/store'
import { selectSettings } from '@/store/settingsSlice'
import { RedefineBalanceChanges } from '../security/redefine/RedefineBalanceChange'
import UnknownContractError from './UnknownContractError'
import RiskConfirmationError from './RiskConfirmationError'
import useDecodeTx from '@/hooks/useDecodeTx'
import { ErrorBoundary } from '@sentry/react'
import ApprovalEditor from '../ApprovalEditor'
import { isDelegateCall } from '@/services/tx/tx-sender/sdk'
import { getTransactionTrackingType } from '@/services/analytics/tx-tracking'
import { TX_EVENTS } from '@/services/analytics/events/transactions'
import { trackEvent } from '@/services/analytics'
import useChainId from '@/hooks/useChainId'

export type SubmitCallback = (txId: string, isExecuted?: boolean) => void

export type SignOrExecuteProps = {
  txId?: string
  onSubmit?: SubmitCallback
  children?: ReactNode
  isExecutable?: boolean
  isRejection?: boolean
  isBatch?: boolean
  isBatchable?: boolean
  onlyExecute?: boolean
  disableSubmit?: boolean
  origin?: string
  isCreation?: boolean
}

const trackTxEvents = async (chainId: string, txId: string, isCreation: boolean, isExecuted: boolean) => {
  const event = isCreation ? TX_EVENTS.CREATE : isExecuted ? TX_EVENTS.EXECUTE : TX_EVENTS.CONFIRM
  const txType = await getTransactionTrackingType(chainId, txId)
  trackEvent({ ...event, label: txType })

  // Immediate execution on creation
  if (isCreation && isExecuted) {
    trackEvent({ ...TX_EVENTS.EXECUTE, label: txType })
  }
}

export const SignOrExecuteForm = ({
  chainId,
  safeTx,
  safeTxError,
  onSubmit,
  ...props
}: SignOrExecuteProps & {
  chainId: ReturnType<typeof useChainId>
  safeTx: ReturnType<typeof useSafeTx>
  safeTxError: ReturnType<typeof useSafeTxError>
}): ReactElement => {
  const { transactionExecution } = useAppSelector(selectSettings)
  const [shouldExecute, setShouldExecute] = useState<boolean>(transactionExecution)
  const isCreation = !props.txId
  const isNewExecutableTx = useImmediatelyExecutable() && isCreation
  const isCorrectNonce = useValidateNonce(safeTx)
  const [decodedData, decodedDataError, decodedDataLoading] = useDecodeTx(safeTx)
  const isBatchable = props.isBatchable !== false && safeTx && !isDelegateCall(safeTx)

  const { safe } = useSafeInfo()
  const isCounterfactualSafe = !safe.deployed

  // If checkbox is checked and the transaction is executable, execute it, otherwise sign it
  const canExecute = isCorrectNonce && (props.isExecutable || isNewExecutableTx)
  const willExecute = (props.onlyExecute || shouldExecute) && canExecute

  const onFormSubmit = useCallback<SubmitCallback>(
    async (txId, isExecuted = false) => {
      onSubmit?.(txId, isExecuted)

      // Track tx event
      trackTxEvents(chainId, txId, isCreation, isExecuted)
    },
    [chainId, isCreation, onSubmit],
  )

  return (
    <>
      <TxCard>
        {props.children}

        <ErrorBoundary fallback={<div>Error parsing data</div>}>
          <ApprovalEditor safeTransaction={safeTx} />
        </ErrorBoundary>

        <DecodedTx
          tx={safeTx}
          txId={props.txId}
          decodedData={decodedData}
          decodedDataError={decodedDataError}
          decodedDataLoading={decodedDataLoading}
          showMultisend={!props.isBatch}
        />

        {!isCounterfactualSafe && <RedefineBalanceChanges />}
      </TxCard>

      {!isCounterfactualSafe && (
        <TxCard>
          <TxChecks />
        </TxCard>
      )}

      <TxCard>
        <ConfirmationTitle
          variant={willExecute ? ConfirmationTitleTypes.execute : ConfirmationTitleTypes.sign}
          isCreation={isCreation}
        />

        {safeTxError && (
          <ErrorMessage error={safeTxError}>
            This transaction will most likely fail. To save gas costs, avoid confirming the transaction.
          </ErrorMessage>
        )}

        {/* {canExecute && !props.onlyExecute && !isCounterfactualSafe && <ExecuteCheckbox onChange={setShouldExecute} />} */}

        <WrongChainWarning />

        <UnknownContractError />

        <RiskConfirmationError />

        {
          // isCounterfactualSafe ? (
          //   <CounterfactualForm {...props} safeTx={safeTx} isCreation={isCreation} onSubmit={onFormSubmit} onlyExecute />
          // ) :
          // willExecute ? (
          <ExecuteForm {...props} safeTx={safeTx} isCreation={isCreation} onSubmit={onFormSubmit} />
          // ) : (
          //   <SignForm
          //     {...props}
          //     safeTx={safeTx}
          //     isBatchable={isBatchable}
          //     isCreation={isCreation}
          //     onSubmit={onFormSubmit}
          //   />
          // )
        }
      </TxCard>
    </>
  )
}

const useSafeTx = () => useContext(SafeTxContext).safeTx
const useSafeTxError = () => useContext(SafeTxContext).safeTxError

export default madProps(SignOrExecuteForm, {
  chainId: useChainId,
  safeTx: useSafeTx,
  safeTxError: useSafeTxError,
})
